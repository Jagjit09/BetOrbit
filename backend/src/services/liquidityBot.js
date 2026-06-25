import prisma from '../config/db.js';
import { matchOrder } from './matchingEngine.js';

// Ensure market maker account exists
async function getOrCreateMarketMaker() {
  let mm = await prisma.user.findUnique({
    where: { email: 'market_maker@betorbit.com' },
  });

  if (!mm) {
    mm = await prisma.user.create({
      data: {
        name: 'Market Maker Bot',
        email: 'market_maker@betorbit.com',
        passwordHash: 'dummy_hash_not_used',
        role: 'admin',
        demoBalance: 10000000.0, // Multi-millionaire bot
      },
    });
  }

  return mm;
}

// Generate standard bids/asks for an outcome around the current target price
async function replenishOutcomeLiquidity(tx, marketId, outcome, targetPrice, mmId) {
  // Check active open orders from the market maker for this outcome
  const activeOrders = await tx.order.findMany({
    where: {
      outcomeId: outcome.id,
      userId: mmId,
      status: 'open',
    },
  });

  const bids = activeOrders.filter(o => o.side === 'buy');
  const asks = activeOrders.filter(o => o.side === 'sell');

  // Let's ensure we have buy orders below targetPrice (e.g., targetPrice - 0.02, targetPrice - 0.05)
  // And sell orders above targetPrice (e.g., targetPrice + 0.02, targetPrice + 0.05)
  const targetBids = [
    { price: Math.max(0.01, parseFloat((targetPrice - 0.02).toFixed(2))), qty: 100 },
    { price: Math.max(0.01, parseFloat((targetPrice - 0.05).toFixed(2))), qty: 250 },
    { price: Math.max(0.01, parseFloat((targetPrice - 0.10).toFixed(2))), qty: 500 },
  ];

  const targetAsks = [
    { price: Math.min(0.99, parseFloat((targetPrice + 0.02).toFixed(2))), qty: 100 },
    { price: Math.min(0.99, parseFloat((targetPrice + 0.05).toFixed(2))), qty: 250 },
    { price: Math.min(0.99, parseFloat((targetPrice + 0.10).toFixed(2))), qty: 500 },
  ];

  const createdOrderIds = [];

  // Place Bids if not present
  for (const tb of targetBids) {
    const exists = bids.some(o => Math.abs(o.price - tb.price) < 0.009);
    if (!exists && tb.price > 0 && tb.price < 1) {
      const order = await tx.order.create({
        data: {
          userId: mmId,
          marketId,
          outcomeId: outcome.id,
          side: 'buy',
          price: tb.price,
          quantity: tb.qty,
          filledQuantity: 0.0,
          status: 'open',
        },
      });
      createdOrderIds.push(order.id);
    }
  }

  // Place Asks if not present
  for (const ta of targetAsks) {
    const exists = asks.some(o => Math.abs(o.price - ta.price) < 0.009);
    if (!exists && ta.price > 0 && ta.price < 1) {
      const order = await tx.order.create({
        data: {
          userId: mmId,
          marketId,
          outcomeId: outcome.id,
          side: 'sell',
          price: ta.price,
          quantity: ta.qty,
          filledQuantity: 0.0,
          status: 'open',
        },
      });
      createdOrderIds.push(order.id);
    }
  }

  return createdOrderIds;
}

export async function runLiquidityBot() {
  try {
    const mm = await getOrCreateMarketMaker();
    const openMarkets = await prisma.market.findMany({
      where: { status: 'open' },
      include: { outcomes: true },
    });

    for (const market of openMarkets) {
      // Find outcomes
      const yesOutcome = market.outcomes.find(o => o.name === 'YES' || o.name === 'Up');
      const noOutcome = market.outcomes.find(o => o.name === 'NO' || o.name === 'Down');

      if (!yesOutcome || !noOutcome) continue;

      // Determine targets
      // YES + NO should approximate 1.00. We can look at the currentPrice of YES and NO.
      // If they drift, let's keep them anchored: YES = targetPrice, NO = 1 - targetPrice
      const yesPrice = yesOutcome.currentPrice;
      const noPrice = noOutcome.currentPrice;

      // Cancel all existing open orders from the market maker for this market to reflect the new price instantly
      await prisma.order.updateMany({
        where: {
          marketId: market.id,
          userId: mm.id,
          status: 'open',
        },
        data: { status: 'cancelled' },
      });

      // Run liquidity placement inside a transaction to ensure atomic execution
      const newOrders = await prisma.$transaction(async (tx) => {
        const orderIdsYES = await replenishOutcomeLiquidity(tx, market.id, yesOutcome, yesPrice, mm.id);
        const orderIdsNO = await replenishOutcomeLiquidity(tx, market.id, noOutcome, noPrice, mm.id);
        return [...orderIdsYES, ...orderIdsNO];
      });

      // Run matching on new liquidity orders in case they overlap with pending user limit orders
      for (const orderId of newOrders) {
        await matchOrder(orderId).catch(err => console.error('Match error on MM order:', err));
      }
    }
  } catch (error) {
    console.error('Error running liquidity bot:', error);
  }
}

// Start bot loop
export const startLiquidityBot = (intervalMs = 15000) => {
  // Run immediately
  runLiquidityBot();

  // Run periodically
  setInterval(() => {
    runLiquidityBot();
  }, intervalMs);
  
  console.log(`Liquidity bot scheduler started (interval: ${intervalMs / 1000}s).`);
};
