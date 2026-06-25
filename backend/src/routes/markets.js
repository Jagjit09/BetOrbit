import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { io } from '../services/socket.js';
import { checkAndProcessRapidMarkets } from '../services/rapidMarketManager.js';

const router = express.Router();

// GET /api/markets - Fetch all markets with filters
router.get('/', async (req, res) => {
  try {
    const { category, status, search, limit, isRapid } = req.query;

    // Run rapid market check-up on request to ensure active rapid market is healthy & active
    if (isRapid === 'true' || category === 'Crypto' || !category) {
      await checkAndProcessRapidMarkets().catch(e => console.error('Error ticking rapid markets on request:', e));
    }

    const whereClause = {};

    if (category) {
      whereClause.category = category;
    }

    if (status) {
      whereClause.status = status;
    }

    if (isRapid !== undefined) {
      whereClause.isRapid = isRapid === 'true';
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const markets = await prisma.market.findMany({
      where: whereClause,
      include: {
        outcomes: true,
        marketResolution: {
          include: {
            winningOutcome: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit ? parseInt(limit) : undefined,
    });

    res.json({ markets });
  } catch (error) {
    console.error('Fetch markets error:', error);
    res.status(500).json({ error: 'Server error fetching markets' });
  }
});

// GET /api/markets/:id - Fetch single market details
router.get('/:id', async (req, res) => {
  try {
    const market = await prisma.market.findUnique({
      where: { id: req.params.id },
      include: {
        outcomes: true,
        marketResolution: {
          include: {
            winningOutcome: true,
          },
        },
      },
    });

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    res.json({ market });
  } catch (error) {
    console.error('Fetch market details error:', error);
    res.status(500).json({ error: 'Server error fetching market' });
  }
});

// GET /api/markets/:id/orderbook - Get order book depth
router.get('/:id/orderbook', async (req, res) => {
  try {
    const marketId = req.params.id;

    // Fetch outcomes
    const outcomes = await prisma.outcome.findMany({
      where: { marketId },
    });

    const book = {};

    for (const outcome of outcomes) {
      // Find open buy orders (bids), group by price and sum quantities
      const bids = await prisma.order.groupBy({
        by: ['price'],
        where: {
          outcomeId: outcome.id,
          side: 'buy',
          status: 'open',
        },
        _sum: {
          quantity: true,
          filledQuantity: true,
        },
        orderBy: {
          price: 'desc', // Highest bids first
        },
      });

      // Find open sell orders (asks), group by price and sum quantities
      const asks = await prisma.order.groupBy({
        by: ['price'],
        where: {
          outcomeId: outcome.id,
          side: 'sell',
          status: 'open',
        },
        _sum: {
          quantity: true,
          filledQuantity: true,
        },
        orderBy: {
          price: 'asc', // Cheapest asks first
        },
      });

      // Format books
      const formatBookEntry = (entries) =>
        entries.map((e) => ({
          price: e.price,
          quantity: parseFloat((e._sum.quantity - e._sum.filledQuantity).toFixed(2)),
        }));

      book[outcome.name] = {
        outcomeId: outcome.id,
        bids: formatBookEntry(bids),
        asks: formatBookEntry(asks),
      };
    }

    res.json({ orderBook: book });
  } catch (error) {
    console.error('Fetch order book error:', error);
    res.status(500).json({ error: 'Server error fetching order book' });
  }
});

// GET /api/markets/:id/trades - Get recent trades
router.get('/:id/trades', async (req, res) => {
  try {
    const trades = await prisma.trade.findMany({
      where: { marketId: req.params.id },
      include: {
        outcome: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ trades });
  } catch (error) {
    console.error('Fetch trades error:', error);
    res.status(500).json({ error: 'Server error fetching trades' });
  }
});

// GET /api/markets/:id/chart - Price history chart
router.get('/:id/chart', async (req, res) => {
  try {
    const marketId = req.params.id;

    // Fetch market details to check if it is rapid/crypto
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: { outcomes: true },
    });

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    // Find the YES or Up outcome
    const yesOutcome = market.outcomes.find(o => o.name === 'YES' || o.name === 'Up');

    if (!yesOutcome) {
      return res.status(404).json({ error: 'Outcome not found' });
    }

    // Get trades for this outcome
    const trades = await prisma.trade.findMany({
      where: { outcomeId: yesOutcome.id },
      orderBy: { createdAt: 'asc' },
      select: {
        price: true,
        createdAt: true,
      },
    });

    let chartData = trades.map((t) => ({
      time: t.createdAt.toISOString(),
      price: t.price,
    }));

    // If no trades and it's a rapid or crypto market, fetch live global klines from Binance!
    if (chartData.length === 0 && (market.isRapid || market.category === 'Crypto')) {
      let symbol = 'BTCUSDT';
      const titleLower = market.title.toLowerCase();
      if (titleLower.includes('ethereum') || titleLower.includes('eth')) {
        symbol = 'ETHUSDT';
      } else if (titleLower.includes('solana') || titleLower.includes('sol')) {
        symbol = 'SOLUSDT';
      }

      try {
        // Fetch last 30 minutes of 1m intervals
        const binanceRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=30`);
        if (binanceRes.ok) {
          const klines = await binanceRes.json();
          chartData = klines.map((k) => ({
            time: new Date(k[0]).toISOString(),
            price: parseFloat(k[4]), // closing price
          }));
        }
      } catch (err) {
        console.error('Error fetching Binance klines for chart:', err);
      }
    }

    // Final fallback starting point if chartData is still empty
    if (chartData.length === 0) {
      chartData.push({
        time: market.createdAt.toISOString(),
        price: 0.50,
      });
    }

    res.json({ chartData });
  } catch (error) {
    console.error('Fetch chart data error:', error);
    res.status(500).json({ error: 'Server error fetching chart data' });
  }
});

// GET /api/markets/:id/comments - Get comments
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { marketId: req.params.id },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ comments });
  } catch (error) {
    console.error('Fetch comments error:', error);
    res.status(500).json({ error: 'Server error fetching comments' });
  }
});

// POST /api/markets/:id/comments - Add comment (protected)
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }

    const comment = await prisma.comment.create({
      data: {
        marketId: req.params.id,
        userId: req.user.id,
        content: content.trim(),
      },
      include: {
        user: { select: { name: true } },
      },
    });

    // Notify market room
    if (io) {
      io.to(req.params.id).emit('newComment', { comment });
    }

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Server error adding comment' });
  }
});

export default router;
