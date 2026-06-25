import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'betorbit_secret_key_123_456_789';

// Zod schemas for request validation
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        mobile: data.mobile || null,
        passwordHash,
        demoBalance: 1000.0, // 1000 demo coins faucet starting balance
      },
    });

    // Create a transaction record for starting coins
    await prisma.walletTransaction.create({
      data: {
        userId: user.id,
        type: 'credit',
        amount: 1000.0,
        reason: 'Welcome Demo Bonus',
        balanceAfter: 1000.0,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        demoBalance: user.demoBalance,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Register error:', error);
    res.status(500).json({ 
      error: 'Server error during registration',
      message: error.message,
      stack: error.stack
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        demoBalance: user.demoBalance,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    let debugInfo = {};
    try {
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;
      const { fileURLToPath } = await import('url');
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const srcPath = path.resolve(__dirname, '../../prisma/dev.db');
      const destPath = '/tmp/dev.db';
      debugInfo = {
        srcPath,
        srcExists: fs.existsSync(srcPath),
        destExists: fs.existsSync(destPath),
        srcSize: fs.existsSync(srcPath) ? fs.statSync(srcPath).size : -1,
        destSize: fs.existsSync(destPath) ? fs.statSync(destPath).size : -1,
      };
    } catch (fsErr) {
      debugInfo = { error: fsErr.message };
    }
    res.status(500).json({ 
      error: 'Server error during login',
      message: error.message,
      stack: error.stack,
      debug: debugInfo
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        demoBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

export default router;
