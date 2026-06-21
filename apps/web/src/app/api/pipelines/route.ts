/**
 * Pipelines Collection API Endpoint
 *
 * GET /api/pipelines — List all active pipelines
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(): Promise<NextResponse> {
  try {
    const pipelines = await prisma.pipeline.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ data: pipelines, count: pipelines.length })
  } catch (error) {
    console.error('Failed to fetch pipelines:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch pipelines',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
