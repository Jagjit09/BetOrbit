import express from 'express';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/portfolio - Fetch active positions and P&L
router.get('/portfolio', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user details to get balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { demoBalance: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User session expired. Please log in again.' });
    }

    // Fetch user positions
    const positions = await prisma.position.findMany({
      where: { userId },
      include: {
        market: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
          },
        },
        outcome: {
          select: {
            id: true,
            name: true,
            currentPrice: true,
          },
        },
      },
    });

    let totalPositionsValue = 0.0;
    let totalInvested = 0.0;

    const formattedPositions = positions.map((pos) => {
      const currentPrice = pos.outcome.currentPrice;
      const currentValue = pos.quantity * currentPrice;
      const initialValue = pos.quantity * pos.averagePrice;
      const profitLoss = currentValue - initialValue;
      const profitLossPercent = pos.averagePrice > 0 ? (profitLoss / initialValue) * 100 : 0;

      totalPositionsValue += currentValue;
      totalInvested += initialValue;

      return {
        id: pos.id,
        marketId: pos.marketId,
        marketTitle: pos.market.title,
        marketStatus: pos.market.status,
        outcomeId: pos.outcomeId,
        outcomeName: pos.outcome.name,
        quantity: pos.quantity,
        averagePrice: pos.averagePrice,
        currentPrice,
        currentValue: parseFloat(currentValue.toFixed(2)),
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
      };
    });

    const netAssetValue = parseFloat((user.demoBalance + totalPositionsValue).toFixed(2));
    const totalProfitLoss = parseFloat((totalPositionsValue - totalInvested).toFixed(2));

    res.json({
      portfolio: {
        positions: formattedPositions,
        demoBalance: user.demoBalance,
        totalPositionsValue: parseFloat(totalPositionsValue.toFixed(2)),
        netAssetValue,
        totalProfitLoss,
      },
    });
  } catch (error) {
    console.error('Fetch portfolio error:', error);
    res.status(500).json({ error: 'Server error fetching portfolio' });
  }
});

// GET /api/wallet - Get balance
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { demoBalance: true },
    });
    res.json({ demoBalance: user?.demoBalance || 0 });
  } catch (error) {
    console.error('Fetch wallet error:', error);
    res.status(500).json({ error: 'Server error fetching wallet balance' });
  }
});

// GET /api/wallet/transactions - Get wallet transaction history
router.get('/wallet/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ transactions });
  } catch (error) {
    console.error('Fetch wallet transactions error:', error);
    res.status(500).json({ error: 'Server error fetching transaction history' });
  }
});

// POST /api/wallet/faucet - Claim free demo coins (+1000)
router.post('/wallet/faucet', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const amount = 1000.0;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: 'User session expired. Please log in again.' });
    }
    
    // Set restriction: can only claim if balance is less than 500 to prevent spamming
    if (user.demoBalance >= 500) {
      return res.status(400).json({ error: 'You can only claim demo coins when your balance falls below 500 coins.' });
    }

    const newBal = user.demoBalance + amount;

    await prisma.user.update({
      where: { id: userId },
      data: { demoBalance: newBal },
    });

    const tx = await prisma.walletTransaction.create({
      data: {
        userId,
        type: 'credit',
        amount,
        reason: 'Demo Faucet Claim',
        balanceAfter: newBal,
      },
    });

    res.json({
      message: 'Claim successful! +1000 demo coins added.',
      demoBalance: newBal,
      transaction: tx,
    });
  } catch (error) {
    console.error('Faucet claim error:', error);
    res.status(500).json({ error: 'Server error claiming coins' });
  }
});

// GET /api/leaderboard - Global rankings by Net Asset Value (NAV)
router.get('/leaderboard', async (req, res) => {
  try {
    // To calculate NAV per user, fetch all users and their positions
    const users = await prisma.user.findMany({
      where: { role: 'user' }, // Exclude admin accounts
      select: {
        id: true,
        name: true,
        demoBalance: true,
        positions: {
          include: {
            outcome: { select: { currentPrice: true } },
          },
        },
      },
    });

    const leaderboard = users.map((u) => {
      const positionsValue = u.positions.reduce(
        (sum, pos) => sum + pos.quantity * pos.outcome.currentPrice,
        0
      );
      const nav = parseFloat((u.demoBalance + positionsValue).toFixed(2));

      return {
        id: u.id,
        name: u.name,
        demoBalance: u.demoBalance,
        positionsValue: parseFloat(positionsValue.toFixed(2)),
        netAssetValue: nav,
      };
    });

    // Sort by Net Asset Value descending
    leaderboard.sort((a, b) => b.netAssetValue - a.netAssetValue);

    // Limit to top 20
    const top20 = leaderboard.slice(0, 20);

    res.json({ leaderboard: top20 });
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    res.status(500).json({ error: 'Server error fetching leaderboard' });
  }
});

// GET /api/wallet/accounts - Get linked bank and crypto accounts
router.get('/wallet/accounts', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        bankName: true,
        bankAccount: true,
        bankRouting: true,
        cryptoBtc: true,
        cryptoEth: true,
        cryptoUsdt: true,
      },
    });
    res.json({ accounts: user });
  } catch (error) {
    console.error('Fetch wallet accounts error:', error);
    res.status(500).json({ error: 'Server error fetching linked accounts' });
  }
});

// PUT /api/wallet/accounts - Update linked bank and crypto accounts
router.put('/wallet/accounts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bankName, bankAccount, bankRouting, cryptoBtc, cryptoEth, cryptoUsdt } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        bankRouting: bankRouting || null,
        cryptoBtc: cryptoBtc || null,
        cryptoEth: cryptoEth || null,
        cryptoUsdt: cryptoUsdt || null,
      },
      select: {
        bankName: true,
        bankAccount: true,
        bankRouting: true,
        cryptoBtc: true,
        cryptoEth: true,
        cryptoUsdt: true,
      },
    });

    res.json({ message: 'Linked accounts updated successfully', accounts: updatedUser });
  } catch (error) {
    console.error('Update wallet accounts error:', error);
    res.status(500).json({ error: 'Server error updating linked accounts' });
  }
});

export default router;
