import http from 'http';
import dotenv from 'dotenv';
import app from './server.js';
import { setupSocket } from './services/socket.js';
import { startLiquidityBot } from './services/liquidityBot.js';
import { startRapidMarketManager } from './services/rapidMarketManager.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO
setupSocket(server);

// Start Automated services
console.log('Booting automated services...');
startLiquidityBot(15000); // Replenish order books every 15 seconds
startRapidMarketManager(1000); // Tick rapid markets every 1 second (updates timers)

// Listen
server.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`   BetOrbit Server running on port ${PORT}`);
  console.log(`========================================`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
