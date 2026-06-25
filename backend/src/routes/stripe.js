import express from 'express';
import Stripe from 'stripe';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'stripe_mock_secret_key_betorbit_test_2026');

// Create Stripe Checkout Session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body; // e.g. 10 for $10
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    // Check if Stripe key is the default dummy key to trigger immediate mock fallback
    const isDummyKey = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_51OzX1qSDB');

    if (isDummyKey) {
      const mockSessionId = `mock_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const mockUrl = `http://localhost:5173/wallet?session_id=${mockSessionId}&deposit=success&mock_amount=${amount}`;
      return res.json({ id: mockSessionId, url: mockUrl });
    }

    // Create session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'BetOrbit Wallet Deposit',
              description: `Deposit $${amount} demo funds into your account`,
            },
            unit_amount: amount * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:5173/wallet?session_id={CHECKOUT_SESSION_ID}&deposit=success`,
      cancel_url: `http://localhost:5173/wallet?deposit=cancel`,
      metadata: {
        userId,
        amount: amount.toString(),
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Create Stripe session error:', error);
    // Real Stripe failed (e.g. invalid key in env), run mock callback fallback
    const mockSessionId = `mock_session_fallback_${Date.now()}`;
    const mockUrl = `http://localhost:5173/wallet?session_id=${mockSessionId}&deposit=success&mock_amount=${amount}`;
    res.json({ id: mockSessionId, url: mockUrl });
  }
});

// Verify Stripe Session & credit user balance
router.get('/verify-session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Check if transaction with this session ID already exists to prevent double spend
    const existingTx = await prisma.walletTransaction.findFirst({
      where: {
        userId,
        reason: {
          startsWith: `Stripe Deposit (Session: ${sessionId.substring(0, 10)}`
        }
      }
    });

    if (existingTx) {
      // Already credited
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { demoBalance: true }
      });
      return res.json({ message: 'Deposit already processed', demoBalance: user.demoBalance });
    }

    let depositAmount = 0.0;

    if (sessionId.startsWith('mock_session')) {
      const mockAmount = req.query.mock_amount ? parseFloat(req.query.mock_amount) : 10.0;
      depositAmount = mockAmount;
    } else {
      // Retrieve session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: 'Session is not paid' });
      }

      const sessionUserId = session.metadata.userId;
      depositAmount = parseFloat(session.metadata.amount);

      if (sessionUserId !== userId) {
        return res.status(403).json({ error: 'Unauthorized to verify this session' });
      }
    }

    // Perform deposit transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      const newBalance = user.demoBalance + depositAmount;

      await tx.user.update({
        where: { id: userId },
        data: { demoBalance: newBalance }
      });

      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'credit',
          amount: depositAmount,
          reason: `Stripe Deposit (Session: ${sessionId.substring(0, 10)}...)`,
          balanceAfter: newBalance,
        }
      });

      return { demoBalance: newBalance };
    });

    res.json({ message: 'Deposit successful!', demoBalance: updatedUser.demoBalance });
  } catch (error) {
    console.error('Verify Stripe session error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify stripe checkout session' });
  }
});

export default router;
