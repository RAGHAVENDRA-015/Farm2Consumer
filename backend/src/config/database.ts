import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    log: ['error', 'warn'],
  });

if (env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connectDatabase(retries = 5, delayMs = 1500): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      logger.info('Connected to PostgreSQL database via Prisma');
      return;
    } catch (error) {
      logger.warn(`Database connection attempt ${attempt}/${retries} failed. Retrying in ${delayMs}ms...`);
      if (attempt === retries) {
        logger.error('Database connection error (all retries exhausted):', error);
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

