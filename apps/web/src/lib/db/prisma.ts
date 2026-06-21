/**
 * PrismaClient singleton
 *
 * Avoids "too many Prisma Clients" error in development due to hot-reloading.
 * Enables query logging in development for observability.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaClientOptions } from '@prisma/client/runtime/library';

// Global singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma client configuration with development logging
 */
const prismaOptions: PrismaClientOptions = {
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn'] as const
    : ['error'] as const,
};

/**
 * Singleton PrismaClient instance
 * Reuses existing instance in hot-reload scenarios
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(prismaOptions);

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
