import prisma from './config/db.js';

async function main() {
  const now = new Date();
  console.log("Current System Time (JS):", now.toISOString(), "Timestamp:", now.getTime());
  
  const markets = await prisma.market.findMany({
    where: { isRapid: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  console.log("\nLast 10 Rapid Markets in DB:");
  markets.forEach(m => {
    console.log(`ID: ${m.id}`);
    console.log(`  Title: ${m.title}`);
    console.log(`  Status: ${m.status}`);
    console.log(`  CreatedAt: ${m.createdAt.toISOString()} (${m.createdAt.getTime()})`);
    console.log(`  EndTime: ${m.endTime.toISOString()} (${m.endTime.getTime()})`);
    console.log(`  Is Expired: ${now >= m.endTime}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
