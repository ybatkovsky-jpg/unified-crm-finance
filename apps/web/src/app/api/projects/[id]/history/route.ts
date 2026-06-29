/**
 * Project Status History API
 *
 * GET /api/projects/[id]/history
 */

import { NextRequest, NextResponse } from 'next/server'
import { projects } from '@/lib/db/projects'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const history = await projects.getHistory(id)
    return NextResponse.json({ data: history })
  } catch (error) {
    console.error('Failed to fetch project history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
