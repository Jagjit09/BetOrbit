import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let prisma;

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const srcPath = path.join(__dirname, '../../prisma/dev.db');
  const destPath = '/tmp/dev.db';

  try {
    fs.copyFileSync(srcPath, destPath);
    fs.chmodSync(destPath, 0o666);
    console.log('Successfully copied SQLite dev.db to writeable /tmp/dev.db and set permissions');
  } catch (err) {
    console.error('Failed to copy SQLite database to /tmp:', err);
  }

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:/tmp/dev.db?connection_limit=1&busy_timeout=15000',
      },
    },
  });
} else {
  prisma = new PrismaClient();
}

export default prisma;
