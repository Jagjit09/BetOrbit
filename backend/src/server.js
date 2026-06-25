import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import marketsRouter from './routes/markets.js';
import adminRouter from './routes/admin.js';
import tradingRouter from './routes/trading.js';
import portfolioRouter from './routes/portfolio.js';
import stripeRouter from './routes/stripe.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for the demo
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/markets', marketsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/orders', tradingRouter);
app.use('/api/payment', stripeRouter);
app.use('/api', portfolioRouter); // Mounts /portfolio, /wallet, /leaderboard, etc.

// Welcome endpoint
app.get('/', (req, res) => {
  res.send('Welcome to BetOrbit Backend API. Please visit the frontend application at <a href="http://localhost:5173">http://localhost:5173</a>');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Fallback for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
