/**
 * PrismaClient singleton (Decimal-normalized)
 *
 * Avoids "too many Prisma Clients" error in development due to hot-reloading.
 * Enables query logging in development for observability.
 * Обёрнут withDecimalNumbers — денежные поля (Decimal(15,2)) возвращаются как number.
 *
 * Делит global-слот `prisma` с src/lib/db.ts — фактически один экземпляр на процесс.
 */

import { PrismaClient } from '@prisma/client';
import { withDecimalNumbers, DecimalNormalizedClient } from './decimal-extension';

// Global singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: DecimalNormalizedClient | undefined;
};

/**
 * Singleton PrismaClient instance (Decimal-normalized)
 * Reuses existing instance in hot-reload scenarios
 */
export const prisma =
  globalForPrisma.prisma ??
  withDecimalNumbers(
    new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    }),
  );

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown hook
 * Call this before process exit to close database connections
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
