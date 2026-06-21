/**
 * Prisma Client Singleton
 *
 * PrismaClient instances should not be created multiple times in development
 * due to hot reloading. This module exports a singleton instance that persists
 * across hot reloads while preventing connection pool exhaustion.
 *
 * In development, Next.js hot module replacement can create multiple instances
 * if the client is instantiated at module scope. We use a global pattern to
 * cache the instance across reloads.
 *
 * @see https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client'

// Global type extension for the singleton cache
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

/**
 * Get or create the singleton PrismaClient instance.
 *
 * In development, reuses the cached instance from the global scope.
 * In production, creates a new instance on first call.
 *
 * @returns PrismaClient singleton instance
 */
export function getPrismaClient(): PrismaClient {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  return global.prisma
}

/**
 * Default export for convenience.
 * Use this for direct imports: `import prisma from '@/lib/db'`
 */
const prisma = getPrismaClient()
export default prisma
