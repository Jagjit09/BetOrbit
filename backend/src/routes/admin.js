import express from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { resolveRapidMarket } from '../services/rapidMarketManager.js';
import { io } from '../services/socket.js';

const router = express.Router();

const createMarketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string(),
  resolutionSource: z.string(),
  endTime: z.string().transform((str) => new Date(str)),
});

// POST /api/admin/markets - Create a new market (Admin Only)
router.post('/markets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = createMarketSchema.parse(req.body);

    const market = await prisma.market.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        resolutionSource: data.resolutionSource,
        endTime: data.endTime,
        status: 'open',
      },
    });

    // Create YES and NO outcomes
    await prisma.outcome.createMany({
      data: [
        { marketId: market.id, name: 'YES', currentPrice: 0.50 },
        { marketId: market.id, name: 'NO', currentPrice: 0.50 },
      ],
    });

    const fullMarket = await prisma.market.findUnique({
      where: { id: market.id },
      include: { outcomes: true },
    });

    // Broadcast new market to all sockets
    if (io) {
      io.emit('newMarket', { marketId: market.id });
    }

    res.status(201).json({ message: 'Market created successfully', market: fullMarket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create market error:', error);
    res.status(500).json({ error: 'Server error creating market' });
  }
});

// POST /api/admin/markets/:id/resolve - Resolve market (Admin Only)
router.post('/markets/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { winningOutcomeId, proofUrl, notes } = req.body;

    if (!winningOutcomeId) {
      return res.status(400).json({ error: 'Winning outcome ID is required' });
    }

    const market = await prisma.market.findUnique({
      where: { id: req.params.id },
      include: { outcomes: true },
    });

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    if (market.status !== 'open') {
      return res.status(400).json({ error: 'Market is already closed or resolved' });
    }

    // Verify outcome exists in this market
    const outcomeExists = market.outcomes.some((o) => o.id === winningOutcomeId);
    if (!outcomeExists) {
      return res.status(400).json({ error: 'Invalid winning outcome ID for this market' });
    }

    const resolved = await resolveRapidMarket(
      market,
      winningOutcomeId,
      proofUrl || 'Manual Admin Resolution',
      notes || 'Market resolved by administrator.'
    );

    // Notify clients of manual resolution
    if (io) {
      io.to(market.id).emit('marketResolved', {
        marketId: market.id,
        winningOutcomeId,
        notes: notes || 'Market resolved by administrator.',
      });
    }

    res.json({ message: 'Market resolved successfully', market: resolved });
  } catch (error) {
    console.error('Resolve market error:', error);
    res.status(500).json({ error: 'Server error resolving market' });
  }
});

export default router;
