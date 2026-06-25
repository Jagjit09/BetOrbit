import express from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { matchOrder } from '../services/matchingEngine.js';

const router = express.Router();

const placeOrderSchema = z.object({
  marketId: z.string(),
  outcomeId: z.string(),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['limit', 'market']),
  price: z.number().min(0.01).max(0.99).optional(), // Required for limit
  quantity: z.number().positive(),
});

// POST /api/orders - Place a new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = placeOrderSchema.parse(req.body);
    const userId = req.user.id;

    // Check if market is open
    const market = await prisma.market.findUnique({
      where: { id: data.marketId },
    });

    if (!market || market.status !== 'open') {
      return res.status(400).json({ error: 'Market is not open for trading' });
    }

    // Determine target execution price
    let executionPrice = data.price;
    if (data.type === 'market') {
      // Market BUY: price = 0.99 (max limit to match any ask, refunding excess)
      // Market SELL: price = 0.01 (min limit to match any bid)
      executionPrice = data.side === 'buy' ? 0.99 : 0.01;
    } else if (!executionPrice) {
      return res.status(400).json({ error: 'Price is required for limit orders' });
    }

    const orderCost = parseFloat((executionPrice * data.quantity).toFixed(4));

    // Run order placement checks inside a transaction to prevent race conditions
    const order = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });

      if (data.side === 'buy') {
        // 1. BUY check: Does user have enough demoBalance?
        if (user.demoBalance < orderCost) {
          throw new Error('Insufficient demo balance');
        }
      } else {
        // 2. SELL check: Does user own enough shares?
        const position = await tx.position.findUnique({
          where: {
            userId_marketId_outcomeId: {
              userId,
              marketId: data.marketId,
              outcomeId: data.outcomeId,
            },
          },
        });

        if (!position || position.quantity <= 0) {
          throw new Error('You do not own any shares in this outcome');
        }

        // Check if user has other open sell orders locking these shares
        const openSells = await tx.order.findMany({
          where: {
            userId,
            marketId: data.marketId,
            outcomeId: data.outcomeId,
            side: 'sell',
            status: 'open',
          },
        });

        const lockedShares = openSells.reduce((sum, o) => sum + (o.quantity - o.filledQuantity), 0);
        const availableShares = position.quantity - lockedShares;

        if (availableShares < data.quantity) {
          throw new Error(`Insufficient shares available. You own ${position.quantity} shares, but ${lockedShares} are already locked in open sell orders.`);
        }
      }

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          marketId: data.marketId,
          outcomeId: data.outcomeId,
          side: data.side,
          price: executionPrice,
          quantity: data.quantity,
          filledQuantity: 0.0,
          status: 'open',
        },
      });

      return newOrder;
    });

    // Match order immediately using matching engine
    const matchedOrder = await matchOrder(order.id);

    res.status(201).json({
      message: 'Order placed successfully',
      order: matchedOrder || order,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Place order error:', error);
    res.status(400).json({ error: error.message || 'Server error placing order' });
  }
});

// GET /api/orders/my - Get current user's order logs
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        market: { select: { title: true } },
        outcome: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ orders });
  } catch (error) {
    console.error('Fetch my orders error:', error);
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

// DELETE /api/orders/:id - Cancel an open order
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    // Run cancel steps in transaction
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (order.userId !== userId) {
        throw new Error('Unauthorized to cancel this order');
      }

      if (order.status !== 'open') {
        throw new Error('Order is already filled or cancelled');
      }

      // Update status to cancelled
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
      });


    });

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(400).json({ error: error.message || 'Server error cancelling order' });
  }
});

export default router;
