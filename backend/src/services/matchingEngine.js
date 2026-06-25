import prisma from '../config/db.js';
import { io } from './socket.js';

/**
 * Main matching engine function. Runs matching for a newly placed order.
 * Wraps all DB operations in a transaction to ensure atomicity.
 */
export async function matchOrder(orderId) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch the order
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { outcome: true },
      });

      if (!order || order.status !== 'open') return;

      const { marketId, outcomeId, side, price: orderPrice, quantity } = order;
      let remainingQuantity = quantity - order.filledQuantity;

      if (remainingQuantity <= 0) return;

      // 2. Query matching counter-orders that are open
      let counterOrders = [];
      if (side === 'buy') {
        // We want to buy. Look for sell orders where sell_price <= buy_limit_price
        counterOrders = await tx.order.findMany({
          where: {
            marketId,
            outcomeId,
            side: 'sell',
            status: 'open',
            price: { lte: orderPrice },
            userId: { not: order.userId }, // Can't match with self
          },
          orderBy: [
            { price: 'asc' }, // Cheapest sell orders first
            { createdAt: 'asc' }, // First in first out
          ],
        });
      } else {
        // We want to sell. Look for buy orders where buy_price >= sell_limit_price
        counterOrders = await tx.order.findMany({
          where: {
            marketId,
            outcomeId,
            side: 'buy',
            status: 'open',
            price: { gte: orderPrice },
            userId: { not: order.userId }, // Can't match with self
          },
          orderBy: [
            { price: 'desc' }, // Highest buy bids first
            { createdAt: 'asc' },
          ],
        });
      }

      let orderFilledQty = order.filledQuantity;

      // 3. Match loop
      for (const counterOrder of counterOrders) {
        if (remainingQuantity <= 0) break;

        const counterRemaining = counterOrder.quantity - counterOrder.filledQuantity;
        const tradeQty = Math.min(remainingQuantity, counterRemaining);
        const tradePrice = counterOrder.price; // Maker's price rules

        // Perform trade steps
        const buyerId = side === 'buy' ? order.userId : counterOrder.userId;
        const sellerId = side === 'sell' ? order.userId : counterOrder.userId;

        // A. Record Trade
        await tx.trade.create({
          data: {
            marketId,
            outcomeId,
            buyerId,
            sellerId,
            price: tradePrice,
            quantity: tradeQty,
          },
        });

        // B. Debit Buyer's Balance and Update Position
        const buyCost = tradePrice * tradeQty;
        const buyer = await tx.user.findUnique({ where: { id: buyerId } });
        if (buyer.demoBalance < buyCost) {
          throw new Error('Insufficient buyer balance for order fill');
        }
        const newBuyerBal = buyer.demoBalance - buyCost;
        await tx.user.update({
          where: { id: buyerId },
          data: { demoBalance: newBuyerBal },
        });

        await tx.walletTransaction.create({
          data: {
            userId: buyerId,
            type: 'debit',
            amount: buyCost,
            reason: `Order fill trade execution debit (${outcomeId})`,
            balanceAfter: newBuyerBal,
          },
        });

        // Add shares to Buyer's Position
        const existingBuyerPosition = await tx.position.findUnique({
          where: {
            userId_marketId_outcomeId: {
              userId: buyerId,
              marketId,
              outcomeId,
            },
          },
        });

        if (existingBuyerPosition) {
          const totalQty = existingBuyerPosition.quantity + tradeQty;
          const newAvgPrice =
            ((existingBuyerPosition.quantity * existingBuyerPosition.averagePrice) +
              (tradeQty * tradePrice)) /
            totalQty;

          await tx.position.update({
            where: { id: existingBuyerPosition.id },
            data: { quantity: totalQty, averagePrice: newAvgPrice },
          });
        } else {
          await tx.position.create({
            data: {
              userId: buyerId,
              marketId,
              outcomeId,
              quantity: tradeQty,
              averagePrice: tradePrice,
            },
          });
        }

        // C. Update Seller's Balance and Position
        // Seller gets paid: tradePrice * tradeQty
        const saleProceeds = tradePrice * tradeQty;
        const seller = await tx.user.findUnique({ where: { id: sellerId } });
        const newSellerBal = seller.demoBalance + saleProceeds;
        await tx.user.update({
          where: { id: sellerId },
          data: { demoBalance: newSellerBal },
        });

        await tx.walletTransaction.create({
          data: {
            userId: sellerId,
            type: 'credit',
            amount: saleProceeds,
            reason: `Order fill trade payout (${counterOrder.outcomeId})`,
            balanceAfter: newSellerBal,
          },
        });

        // Decrement shares from Seller's Position
        const existingSellerPosition = await tx.position.findUnique({
          where: {
            userId_marketId_outcomeId: {
              userId: sellerId,
              marketId,
              outcomeId,
            },
          },
        });

        if (existingSellerPosition) {
          const newQty = Math.max(0, existingSellerPosition.quantity - tradeQty);
          if (newQty === 0) {
            await tx.position.delete({ where: { id: existingSellerPosition.id } });
          } else {
            await tx.position.update({
              where: { id: existingSellerPosition.id },
              data: { quantity: newQty },
            });
          }
        }

        // D. Update Counter Order filled status
        const counterFilled = counterOrder.filledQuantity + tradeQty;
        const counterStatus = counterFilled >= counterOrder.quantity ? 'filled' : 'open';
        await tx.order.update({
          where: { id: counterOrder.id },
          data: { filledQuantity: counterFilled, status: counterStatus },
        });

        // Update active variables for main order
        orderFilledQty += tradeQty;
        remainingQuantity -= tradeQty;

        // E. Update Outcome's currentPrice to reflect the last traded price
        await tx.outcome.update({
          where: { id: outcomeId },
          data: { currentPrice: tradePrice },
        });
      }

      // 3.5 Fallback to match remaining order quantity directly with Market Maker bot if limit is satisfied
      if (remainingQuantity > 0) {
        const mmPrice = order.outcome.currentPrice || 0.50;
        const satisfiesLimit = side === 'buy' ? (mmPrice <= orderPrice) : (mmPrice >= orderPrice);

        if (satisfiesLimit) {
          const tradeQty = remainingQuantity;
          const tradePrice = mmPrice;

          // Retrieve or create Market Maker Bot account
          let mm = await tx.user.findUnique({
            where: { email: 'market_maker@betorbit.com' },
          });
          if (!mm) {
            mm = await tx.user.create({
              data: {
                name: 'Market Maker Bot',
                email: 'market_maker@betorbit.com',
                passwordHash: 'dummy_hash_not_used',
                role: 'admin',
                demoBalance: 10000000.0,
              },
            });
          }

          const buyerId = side === 'buy' ? order.userId : mm.id;
          const sellerId = side === 'sell' ? order.userId : mm.id;

          // A. Record Trade
          await tx.trade.create({
            data: {
              marketId,
              outcomeId,
              buyerId,
              sellerId,
              price: tradePrice,
              quantity: tradeQty,
            },
          });

          // B. Debit Buyer's Balance and Update Position
          const buyCost = tradePrice * tradeQty;
          const buyer = await tx.user.findUnique({ where: { id: buyerId } });
          if (buyer.demoBalance < buyCost) {
            throw new Error('Insufficient buyer balance for order fill');
          }
          const newBuyerBal = buyer.demoBalance - buyCost;
          await tx.user.update({
            where: { id: buyerId },
            data: { demoBalance: newBuyerBal },
          });

          await tx.walletTransaction.create({
            data: {
              userId: buyerId,
              type: 'debit',
              amount: buyCost,
              reason: `Order fill trade execution debit (${outcomeId})`,
              balanceAfter: newBuyerBal,
            },
          });

          // Add shares to Buyer's Position
          const existingBuyerPosition = await tx.position.findUnique({
            where: {
              userId_marketId_outcomeId: {
                userId: buyerId,
                marketId,
                outcomeId,
              },
            },
          });

          if (existingBuyerPosition) {
            const totalQty = existingBuyerPosition.quantity + tradeQty;
            const newAvgPrice =
              ((existingBuyerPosition.quantity * existingBuyerPosition.averagePrice) +
                (tradeQty * tradePrice)) /
              totalQty;

            await tx.position.update({
              where: { id: existingBuyerPosition.id },
              data: { quantity: totalQty, averagePrice: newAvgPrice },
            });
          } else {
            await tx.position.create({
              data: {
                userId: buyerId,
                marketId,
                outcomeId,
                quantity: tradeQty,
                averagePrice: tradePrice,
              },
            });
          }

          // C. Update Seller's Balance and Position
          const saleProceeds = tradePrice * tradeQty;
          const seller = await tx.user.findUnique({ where: { id: sellerId } });
          const newSellerBal = seller.demoBalance + saleProceeds;
          await tx.user.update({
            where: { id: sellerId },
            data: { demoBalance: newSellerBal },
          });

          await tx.walletTransaction.create({
            data: {
              userId: sellerId,
              type: 'credit',
              amount: saleProceeds,
              reason: `Order fill trade payout (${outcomeId})`,
              balanceAfter: newSellerBal,
            },
          });

          // Decrement shares from Seller's Position
          const existingSellerPosition = await tx.position.findUnique({
            where: {
              userId_marketId_outcomeId: {
                userId: sellerId,
                marketId,
                outcomeId,
              },
            },
          });

          if (existingSellerPosition) {
            const newQty = Math.max(0, existingSellerPosition.quantity - tradeQty);
            if (newQty === 0) {
              await tx.position.delete({ where: { id: existingSellerPosition.id } });
            } else {
              await tx.position.update({
                where: { id: existingSellerPosition.id },
                data: { quantity: newQty },
              });
            }
          }

          // Update outcomes price
          await tx.outcome.update({
            where: { id: outcomeId },
            data: { currentPrice: tradePrice },
          });

          orderFilledQty += tradeQty;
          remainingQuantity -= tradeQty;
        }
      }

      // 4. Update the main order status
      const orderStatus = orderFilledQty >= quantity ? 'filled' : 'open';
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { filledQuantity: orderFilledQty, status: orderStatus },
      });

      // 5. Broadcast updates through Socket.IO
      if (io) {
        io.to(marketId).emit('orderBookUpdate', { marketId });
        io.to(marketId).emit('tradesUpdate', { marketId });
        io.emit('globalActivity', {
          type: 'trade',
          marketId,
          outcomeId,
          qty: orderFilledQty,
          price: orderPrice,
        });
      }

      return updatedOrder;
    });
  } catch (error) {
    console.error('Error matching order:', error);
    throw error;
  }
}
