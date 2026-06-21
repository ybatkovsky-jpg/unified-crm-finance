/**
 * Single Pipeline API Endpoint
 *
 * GET /api/pipelines/[id] — Returns a pipeline with its stages sorted by order
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
      include: {
        DealStage: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!pipeline) {
      return NextResponse.json(
        { error: 'Not found', message: `Pipeline with id ${id} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: pipeline })
  } catch (error) {
    console.error('Failed to fetch pipeline:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch pipeline',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
