import { PrismaClient } from '@prisma/client';
import { withDecimalNumbers, DecimalNormalizedClient } from './db/decimal-extension';

const globalForPrisma = globalThis as unknown as {
  prisma: DecimalNormalizedClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  withDecimalNumbers(
    new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    }),
  );

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
