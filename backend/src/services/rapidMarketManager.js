import prisma from '../config/db.js';
import { io } from './socket.js';

// Helper to fetch BTC price from Binance or fall back to mock price
async function getBTCPrice() {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    if (!res.ok) throw new Error('Binance fetch failed');
    const data = await res.json();
    return parseFloat(data.price);
  } catch (error) {
    // Fallback mock price for offline mode or network issues
    // Do a random walk around 68,000
    const lastMockPrice = global.lastMockPrice || 68450;
    const change = (Math.random() - 0.5) * 80; // +/- $40 fluctuation
    const newPrice = parseFloat((lastMockPrice + change).toFixed(2));
    global.lastMockPrice = newPrice;
    return newPrice;
  }
}

// Function to resolve a rapid market
export async function resolveRapidMarket(market, winningOutcomeId, proofUrl, noteText) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Get all positions for this market
      const positions = await tx.position.findMany({
        where: { marketId: market.id },
      });

      // 2. Distribute payouts (1.00 demo coin per winning share)
      for (const pos of positions) {
        if (pos.outcomeId === winningOutcomeId) {
          const payout = pos.quantity * 1.0; // 1 share = 1 coin payout
          const user = await tx.user.findUnique({ where: { id: pos.userId } });
          const newBal = user.demoBalance + payout;

          await tx.user.update({
            where: { id: pos.userId },
            data: { demoBalance: newBal },
          });

          await tx.walletTransaction.create({
            data: {
              userId: pos.userId,
              type: 'credit',
              amount: payout,
              reason: `Rapid market payout for winning outcome in "${market.title}"`,
              balanceAfter: newBal,
            },
          });
        }
      }

      // 3. Clear/delete all positions for this market
      await tx.position.deleteMany({
        where: { marketId: market.id },
      });

      // 4. Cancel all open/unfilled orders for this market
      const openOrders = await tx.order.findMany({
        where: { marketId: market.id, status: 'open' },
      });



      // Update orders to cancelled
      await tx.order.updateMany({
        where: { marketId: market.id, status: 'open' },
        data: { status: 'cancelled' },
      });

      // 5. Create resolution log
      await tx.marketResolution.create({
        data: {
          marketId: market.id,
          winningOutcomeId,
          resolvedBy: 'Automated System Scheduler',
          proofUrl,
          notes: noteText,
        },
      });

      // 6. Update market status
      const updatedMarket = await tx.market.update({
        where: { id: market.id },
        data: { status: 'resolved' },
      });

      return updatedMarket;
    });
  } catch (error) {
    console.error(`Error resolving rapid market ${market.id}:`, error);
    throw error;
  }
}

let isCreatingMarket = false;

// Spawns a fresh rapid market
export async function createNextRapidMarket() {
  if (isCreatingMarket) return;
  isCreatingMarket = true;
  try {
    const currentPrice = await getBTCPrice();
    const durationMinutes = 5;
    const now = Date.now();
    const intervalMs = durationMinutes * 60 * 1000;
    let endTimeMs = Math.ceil(now / intervalMs) * intervalMs;
    // If the remaining time in this interval is too short (e.g., under 15 seconds), push to the next clean 5-minute boundary
    if (endTimeMs - now < 15 * 1000) {
      endTimeMs += intervalMs;
    }
    const endTime = new Date(endTimeMs);

    const title = 'BTC Up or Down 5m';
    const description = `This is an automated rapid market. Base price index: $${currentPrice.toLocaleString()}. If the spot BTC/USDT price is greater than $${currentPrice.toLocaleString()} at the resolution time, Up outcome wins. Otherwise, Down wins.`;

    const newMarket = await prisma.market.create({
      data: {
        title,
        description,
        category: 'Crypto',
        resolutionSource: 'Binance BTCUSDT spot ticker',
        endTime,
        isRapid: true,
        basePrice: currentPrice,
        status: 'open',
      },
    });

    // Create Up/Down outcomes
    await prisma.outcome.createMany({
      data: [
        { marketId: newMarket.id, name: 'Up', currentPrice: 0.50 },
        { marketId: newMarket.id, name: 'Down', currentPrice: 0.50 },
      ],
    });

    console.log(`Created next 5-minute rapid market: ${newMarket.id} (Threshold: $${currentPrice})`);

    // Broadcast new market to all sockets
    if (io) {
      io.emit('newRapidMarket', { marketId: newMarket.id });
    }
  } catch (error) {
    console.error('Error creating next rapid market:', error);
  } finally {
    isCreatingMarket = false;
  }
}

// Scheduler loop
export async function checkAndProcessRapidMarkets() {
  try {
    // Ensure there is always an active open rapid market running
    const openRapid = await prisma.market.findFirst({
      where: { isRapid: true, status: 'open' },
      include: { outcomes: true },
    });
    if (!openRapid || !openRapid.outcomes || openRapid.outcomes.length < 2) {
      console.log('No valid open rapid market found. Cleaning and spawning next round...');
      if (openRapid) {
        await prisma.market.delete({ where: { id: openRapid.id } }).catch(() => {});
      }
      await createNextRapidMarket();
    }

    const trackingMarkets = await prisma.market.findMany({
      where: { status: 'open', basePrice: { not: null } },
      include: { outcomes: true },
    });

    const btcPrice = await getBTCPrice();

    for (const market of trackingMarkets) {
      // 2. Check if expired (Only resolve rapid rounds automatically)
      if (market.isRapid && new Date() >= market.endTime) {
        console.log(`Rapid market ${market.id} has expired. Resolving...`);

        const thresholdPrice = market.basePrice || 0.0;
        const didWin = btcPrice > thresholdPrice;

        const yesOutcome = market.outcomes.find(o => o.name === 'Up');
        const noOutcome = market.outcomes.find(o => o.name === 'Down');

        const winningOutcome = didWin ? yesOutcome : noOutcome;

        const proofUrl = `https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`;
        const notes = `Target threshold: $${thresholdPrice.toLocaleString()}. Final settled price: $${btcPrice.toLocaleString()}. Winner: ${didWin ? 'Up' : 'Down'}.`;

        // Resolve expired market
        await resolveRapidMarket(market, winningOutcome.id, proofUrl, notes);

        // Notify clients of resolution
        if (io) {
          io.to(market.id).emit('marketResolved', {
            marketId: market.id,
            winningOutcomeId: winningOutcome.id,
            notes,
          });
        }

        // Spawn next round
        await createNextRapidMarket();
      } else {
        // Calculate dynamic price based on difference
        const thresholdPrice = market.basePrice || 0.0;
        const priceDiff = btcPrice - thresholdPrice;
        
        // Daily sensitivity ($800) is higher than 5m rapid ($80) to account for daily volatility
        const isDaily = market.title.toLowerCase().includes('daily');
        const sensitivity = isDaily ? 800.0 : 80.0;
        
        const rawOdds = 0.5 + (priceDiff / (2 * sensitivity));
        const upPrice = Math.max(0.01, Math.min(0.99, parseFloat(rawOdds.toFixed(2))));
        const downPrice = parseFloat((1.0 - upPrice).toFixed(2));
        
        const upOutcome = market.outcomes.find(o => o.name === 'Up');
        const downOutcome = market.outcomes.find(o => o.name === 'Down');
        
        if (upOutcome && downOutcome) {
          if (upOutcome.currentPrice !== upPrice || downOutcome.currentPrice !== downPrice) {
            await prisma.outcome.update({
              where: { id: upOutcome.id },
              data: { currentPrice: upPrice },
            });
            await prisma.outcome.update({
              where: { id: downOutcome.id },
              data: { currentPrice: downPrice },
            });
          }
        }

        // Broadcast countdown tick and price updates
        if (io) {
          const remainingSeconds = Math.max(0, Math.floor((market.endTime - Date.now()) / 1000));
          io.to(market.id).emit('countdownTick', {
            marketId: market.id,
            remainingSeconds,
          });
          
          io.to(market.id).emit('outcomePriceUpdate', {
            marketId: market.id,
            upPrice,
            downPrice,
            currentBTCPrice: btcPrice
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in rapid market scheduler loop:', error);
  }
}

// Start rapid market manager loop
export const startRapidMarketManager = async (tickIntervalMs = 1000) => {
  // Clean up/resolve any old open rapid markets that are in the past before starting the tick loop
  try {
    const expiredOpenMarkets = await prisma.market.findMany({
      where: { isRapid: true, status: 'open', endTime: { lte: new Date() } },
      include: { outcomes: true },
    });
    if (expiredOpenMarkets.length > 0) {
      console.log(`Found ${expiredOpenMarkets.length} expired open rapid markets on start. Auto-resolving/cleaning...`);
      for (const market of expiredOpenMarkets) {
        const yesOutcome = market.outcomes.find(o => o.name === 'Up' || o.name === 'YES');
        const noOutcome = market.outcomes.find(o => o.name === 'Down' || o.name === 'NO');
        const winningId = yesOutcome ? yesOutcome.id : (noOutcome ? noOutcome.id : null);
        if (winningId) {
          await resolveRapidMarket(
            market,
            winningId,
            'System Startup Cleanup',
            'Auto-resolved expired market during system startup cleanup.'
          );
        }
      }
    }
  } catch (err) {
    console.error('Error cleaning up expired rapid markets on start:', err);
  }

  // Check immediately
  checkAndProcessRapidMarkets();

  // Tick every second to push countdown timer to client and check resolution
  setInterval(() => {
    checkAndProcessRapidMarkets();
  }, tickIntervalMs);

  console.log(`Rapid market manager scheduler started (tick interval: ${tickIntervalMs}ms).`);
};
