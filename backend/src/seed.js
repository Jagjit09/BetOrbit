import prisma from './config/db.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Clearing database...');
  await prisma.walletTransaction.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.position.deleteMany({});
  await prisma.trade.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.marketResolution.deleteMany({});
  await prisma.outcome.deleteMany({});
  await prisma.market.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding users...');
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('adminpassword', salt);
  const userPasswordHash = await bcrypt.hash('password123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@betorbit.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      demoBalance: 10000.0, // base unit
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: userPasswordHash,
      role: 'user',
      demoBalance: 1000.0,
    },
  });

  console.log('Seeding prediction markets...');

  // Helper to create a market with outcomes
  async function createMarketWithOutcomes(title, description, category, resolutionSource, endTime, outcomeNames, isRapid = false, basePrice = null) {
    const market = await prisma.market.create({
      data: {
        title,
        description,
        category,
        resolutionSource,
        endTime,
        isRapid,
        basePrice,
        status: 'open',
      },
    });

    const outcomesData = outcomeNames.map((name, idx) => ({
      marketId: market.id,
      name,
      currentPrice: idx === 0 ? 0.50 : 0.50, // default start at 0.50
    }));

    await prisma.outcome.createMany({
      data: outcomesData,
    });

    return market;
  }

  // 1. 5-Min Rapid Market (BTC Up/Down)
  const fiveMinEnd = new Date(Date.now() + 5 * 60 * 1000);
  await createMarketWithOutcomes(
    'BTC Up or Down 5m',
    'BTC price movements relative to the baseline start price index. Base price: $62,591.71.',
    'Crypto',
    'Binance BTCUSDT spot ticker',
    fiveMinEnd,
    ['Up', 'Down'],
    true,
    62591.71
  );

  // 2. Bitcoin hit prices
  const endOfJune = new Date('2026-06-30T23:59:59Z');
  await createMarketWithOutcomes(
    'What price will Bitcoin hit in June? - ↓ 57,500',
    'Will Bitcoin hit below $57,500 in June 2026?',
    'Crypto',
    'Binance BTCUSDT historical spot price',
    endOfJune,
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'What price will Bitcoin hit in June? - ↑ 67,500',
    'Will Bitcoin hit above $67,500 in June 2026?',
    'Crypto',
    'Binance BTCUSDT historical spot price',
    endOfJune,
    ['YES', 'NO']
  );

  // 3. Bitcoin Above X
  await createMarketWithOutcomes(
    'Bitcoin above ___ on June 24? - 56,000',
    'Will Bitcoin close above $56,000 on June 24, 2026?',
    'Crypto',
    'Binance spot price index',
    new Date('2026-06-24T23:59:59Z'),
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'Bitcoin above ___ on June 24? - 58,000',
    'Will Bitcoin close above $58,000 on June 24, 2026?',
    'Crypto',
    'Binance spot price index',
    new Date('2026-06-24T23:59:59Z'),
    ['YES', 'NO']
  );

  // 4. Ethereum hit prices
  await createMarketWithOutcomes(
    'What price will Ethereum hit in June? - ↓ 1,500',
    'Will Ethereum hit below $1,500 in June 2026?',
    'Crypto',
    'Binance ETHUSDT spot price',
    endOfJune,
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'What price will Ethereum hit in June? - ↓ 1,400',
    'Will Ethereum hit below $1,400 in June 2026?',
    'Crypto',
    'Binance ETHUSDT spot price',
    endOfJune,
    ['YES', 'NO']
  );

  // 5. Solana hit prices
  await createMarketWithOutcomes(
    'What price will Solana hit in June? - ↓ 60',
    'Will Solana hit below $60 in June 2026?',
    'Crypto',
    'Binance SOLUSDT spot price',
    endOfJune,
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'What price will Solana hit in June? - ↓ 50',
    'Will Solana hit below $50 in June 2026?',
    'Crypto',
    'Binance SOLUSDT spot price',
    endOfJune,
    ['YES', 'NO']
  );

  // 6. XRP above ___ on June 24?
  await createMarketWithOutcomes(
    'XRP above ___ on June 24? - 0.70',
    'Will XRP close above $0.70 on June 24, 2026?',
    'Crypto',
    'Binance XRPUSDT spot price',
    new Date('2026-06-24T23:59:59Z'),
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'XRP above ___ on June 24? - 0.80',
    'Will XRP close above $0.80 on June 24, 2026?',
    'Crypto',
    'Binance XRPUSDT spot price',
    new Date('2026-06-24T23:59:59Z'),
    ['YES', 'NO']
  );

  // 6b. When will Bitcoin hit $150k?
  await createMarketWithOutcomes(
    'When will Bitcoin hit $150k? - by December 31, 2026',
    'Will Bitcoin reach $150,000 on or before December 31, 2026?',
    'Crypto',
    'Binance BTCUSDT spot price',
    new Date('2026-12-31T23:59:59Z'),
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'When will Bitcoin hit $150k? - by June 30, 2026',
    'Will Bitcoin reach $150,000 on or before June 30, 2026?',
    'Crypto',
    'Binance BTCUSDT spot price',
    new Date('2026-06-30T23:59:59Z'),
    ['YES', 'NO']
  );

  // 6c. BTC Up or Down Daily
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  await createMarketWithOutcomes(
    'BTC Up or Down Daily',
    'BTC price movements relative to the daily baseline open price.',
    'Crypto',
    'Binance BTCUSDT spot ticker',
    endOfDay,
    ['Up', 'Down'],
    false,
    62591.71
  );

  // 7. Iran Conflict prediction pools (Polymarket Screenshot)
  await createMarketWithOutcomes(
    'Strait of Hormuz traffic returns to normal by end of June?',
    'Will Strait of Hormuz shipping traffic return to normal levels by end of June 2026?',
    'Iran',
    'US Energy Information Administration reports',
    endOfJune,
    ['YES', 'NO']
  );

  await createMarketWithOutcomes(
    'Will the Iranian regime fall by June 30?',
    'Will the current ruling structure of the Iranian regime collapse or be replaced by June 30, 2026?',
    'Iran',
    'Major global news consensus (Reuters, AP)',
    endOfJune,
    ['YES', 'NO']
  );

  await createMarketWithOutcomes(
    'Will _ ships transit the Strait of Hormuz on any day by June 30? - 20+',
    'Will 20 or more commercial ships transit the Strait of Hormuz on any single day by June 30, 2026?',
    'Iran',
    'Lloyds List shipping logs',
    endOfJune,
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'Will _ ships transit the Strait of Hormuz on any day by June 30? - 40+',
    'Will 40 or more commercial ships transit the Strait of Hormuz on any single day by June 30, 2026?',
    'Iran',
    'Lloyds List shipping logs',
    endOfJune,
    ['YES', 'NO']
  );

  await createMarketWithOutcomes(
    'How many different countries will Israel strike in 2026? - 4',
    'Will Israel carry out military strikes in 4 different countries in 2026?',
    'Iran',
    'United Nations security briefs',
    endOfJune,
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'How many different countries will Israel strike in 2026? - 5',
    'Will Israel carry out military strikes in 5 or more different countries in 2026?',
    'Iran',
    'United Nations security briefs',
    endOfJune,
    ['YES', 'NO']
  );

  await createMarketWithOutcomes(
    'Strait of Hormuz traffic returns to normal by July 15?',
    'Will Strait of Hormuz traffic return to normal by July 15, 2026?',
    'Iran',
    'US Energy Information Administration reports',
    new Date('2026-07-15T23:59:59Z'),
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'Strait of Hormuz traffic returns to normal by July 31?',
    'Will Strait of Hormuz traffic return to normal by July 31, 2026?',
    'Iran',
    'US Energy Information Administration reports',
    new Date('2026-07-31T23:59:59Z'),
    ['YES', 'NO']
  );

  await createMarketWithOutcomes(
    'US-Iran Final Nuclear Deal by...? - August 31',
    'Will a final nuclear agreement be signed between the US and Iran by August 31, 2026?',
    'Iran',
    'International Atomic Energy Agency reports',
    new Date('2026-08-31T23:59:59Z'),
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'US-Iran Final Nuclear Deal by...? - August 18',
    'Will a final nuclear agreement be signed between the US and Iran by August 18, 2026?',
    'Iran',
    'International Atomic Energy Agency reports',
    new Date('2026-08-18T23:59:59Z'),
    ['YES', 'NO']
  );

  await createMarketWithOutcomes(
    'What Iranian demands will Trump agree to by June 30? - Enrichment of Uranium',
    'Will Donald Trump agree to allow Iran enrichment of uranium by June 30, 2026?',
    'Iran',
    'Official White House press statements',
    endOfJune,
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'What Iranian demands will Trump agree to by June 30? - Transit Fees in the Strait of Hormuz',
    'Will Donald Trump agree to transit fees in the Strait of Hormuz by June 30, 2026?',
    'Iran',
    'Official White House press statements',
    endOfJune,
    ['YES', 'NO']
  );

  await createMarketWithOutcomes(
    'Israel closes its airspace by...? - July 31',
    'Will Israel close its commercial airspace by July 31, 2026?',
    'Iran',
    'Civil Aviation Authority of Israel',
    new Date('2026-07-31T23:59:59Z'),
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'Israel closes its airspace by...? - July 15',
    'Will Israel close its commercial airspace by July 15, 2026?',
    'Iran',
    'Civil Aviation Authority of Israel',
    new Date('2026-07-15T23:59:59Z'),
    ['YES', 'NO']
  );

  // 8. Sports category
  await createMarketWithOutcomes(
    'Will Argentina win the FIFA World Cup 2026?',
    'Will Argentina claim the champion title at the 2026 FIFA World Cup?',
    'Sports',
    'FIFA Official tournament outcomes',
    new Date('2026-07-19T23:59:59Z'),
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'Champions League Winner 2026 - Real Madrid',
    'Will Real Madrid win the UEFA Champions League 2026?',
    'Sports',
    'UEFA official match records',
    new Date('2026-05-30T23:59:59Z'),
    ['YES', 'NO']
  );
  await createMarketWithOutcomes(
    'Champions League Winner 2026 - Manchester City',
    'Will Manchester City win the UEFA Champions League 2026?',
    'Sports',
    'UEFA official match records',
    new Date('2026-05-30T23:59:59Z'),
    ['YES', 'NO']
  );

  // 9. Politics category
  await createMarketWithOutcomes(
    'Will Donald Trump win the US presidential election?',
    'Will Donald Trump win the 2024/2028 US Presidential Election?',
    'Politics',
    'FEC official vote certification logs',
    new Date('2028-11-07T23:59:59Z'),
    ['YES', 'NO']
  );

  // 10. Weather category
  await createMarketWithOutcomes(
    'Will July 2026 be the hottest month on record?',
    'Will the global average temperature in July 2026 set a new record high?',
    'Weather',
    'NOAA monthly global temperature anomaly data',
    new Date('2026-08-15T23:59:59Z'),
    ['YES', 'NO']
  );

  // 11. Technology category
  await createMarketWithOutcomes(
    'Will SpaceX land Starship on Mars by 2027?',
    'Will SpaceX successfully land an uncrewed Starship on Mars before Dec 31, 2027?',
    'Technology',
    'SpaceX official mission press logs',
    new Date('2027-12-31T23:59:59Z'),
    ['YES', 'NO']
  );

  // 12. Add additional bets for 15 Min sidebar category
  const fifteenMinEnd = new Date(Date.now() + 15 * 60 * 1000);
  await createMarketWithOutcomes(
    'BTC Up or Down 15m',
    'Predict if BTC price is Up or Down at the 15-minute mark.',
    'Crypto',
    'Binance spot price index',
    fifteenMinEnd,
    ['Up', 'Down'],
    true
  );
  await createMarketWithOutcomes(
    'ETH Up or Down 15m',
    'Predict if ETH price is Up or Down at the 15-minute mark.',
    'Crypto',
    'Binance spot price index',
    fifteenMinEnd,
    ['Up', 'Down'],
    true
  );

  // 13. Add additional bets for 1 Hour sidebar category
  const oneHourEnd = new Date(Date.now() + 60 * 60 * 1000);
  await createMarketWithOutcomes(
    'BTC Up or Down 1h',
    'Predict if BTC price is Up or Down at the 1-hour mark.',
    'Crypto',
    'Binance spot price index',
    oneHourEnd,
    ['Up', 'Down'],
    true
  );
  await createMarketWithOutcomes(
    'ETH Up or Down 1h',
    'Predict if ETH price is Up or Down at the 1-hour mark.',
    'Crypto',
    'Binance spot price index',
    oneHourEnd,
    ['Up', 'Down'],
    true
  );

  // 14. Add additional bets for 4 Hours sidebar category
  const fourHourEnd = new Date(Date.now() + 4 * 60 * 60 * 1000);
  await createMarketWithOutcomes(
    'BTC Up or Down 4h',
    'Predict if BTC price is Up or Down at the 4-hour mark.',
    'Crypto',
    'Binance spot price index',
    fourHourEnd,
    ['Up', 'Down'],
    true
  );
  await createMarketWithOutcomes(
    'ETH Up or Down 4h',
    'Predict if ETH price is Up or Down at the 4-hour mark.',
    'Crypto',
    'Binance spot price index',
    fourHourEnd,
    ['Up', 'Down'],
    true
  );

  // 15. Additional Politics Bet
  await createMarketWithOutcomes(
    'Will UK re-enter the EU single market by 2027?',
    'Will the United Kingdom sign an agreement to re-enter the EU Single Market by December 31, 2027?',
    'Politics',
    'UK Government official treaty publications',
    new Date('2027-12-31T23:59:59Z'),
    ['YES', 'NO']
  );

  // 16. Additional Weather Bet
  await createMarketWithOutcomes(
    'Will a Category 5 hurricane hit Florida in 2026?',
    'Will the National Hurricane Center record a Category 5 landfall in Florida in 2026?',
    'Weather',
    'NOAA National Hurricane Center official records',
    new Date('2026-11-30T23:59:59Z'),
    ['YES', 'NO']
  );

  // 17. Additional Technology Bet
  await createMarketWithOutcomes(
    'Will OpenAI release GPT-5 in 2026?',
    'Will OpenAI officially launch and make GPT-5 API public in 2026?',
    'Technology',
    'Official OpenAI blog announcements',
    new Date('2026-12-31T23:59:59Z'),
    ['YES', 'NO']
  );

  console.log('Database seeded with premium Polymarket-style topics successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
