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
    console.log('Successfully copied SQLite dev.db to writeable /tmp/dev.db');
  } catch (err) {
    console.error('Failed to copy SQLite database to /tmp:', err);
  }

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:/tmp/dev.db',
      },
    },
  });
} else {
  prisma = new PrismaClient();
}

export default prisma;
