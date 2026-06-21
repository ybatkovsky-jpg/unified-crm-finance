/**
 * Health Check API Endpoint
 *
 * Reports system status including database connectivity.
 * Returns 200 for all healthy services, 503 for any unhealthy service.
 *
 * GET /api/health
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface HealthStatus {
  status: 'UP' | 'DEGRADED' | 'DOWN'
  services: {
    db: 'OK' | 'ERROR'
    rabbitmq?: 'OK' | 'ERROR' | 'NOT_CONFIGURED'
    minio?: 'OK' | 'ERROR' | 'NOT_CONFIGURED'
  }
  timestamp: string
}

/**
 * GET /api/health
 *
 * Checks database connectivity and returns system health status.
 */
export async function GET(): Promise<NextResponse> {
  const services: HealthStatus['services'] = {
    db: 'OK',
  }

  // Check database connectivity
  try {
    // Simple query to test connection - SQLite uses SELECT 1
    await prisma.$queryRaw`SELECT 1`
  } catch (error) {
    console.error('Database health check failed:', error)
    services.db = 'ERROR'
  }

  // Future: Add RabbitMQ health check
  // Future: Add MinIO health check

  const overallStatus: HealthStatus['status'] =
    services.db === 'OK' ? 'UP' : 'DOWN'

  const response: HealthStatus = {
    status: overallStatus,
    services,
    timestamp: new Date().toISOString(),
  }

  // Return 503 if any service is down
  const statusCode = overallStatus === 'UP' ? 200 : 503

  return NextResponse.json(response, { status: statusCode })
}
