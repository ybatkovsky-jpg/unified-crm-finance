/**
 * BOM Lock API Endpoint
 *
 * Lock a BOM to prevent further edits:
 * - POST: Set BOM status to 'locked'
 *
 * POST /api/bom/[id]/lock
 */

import { NextRequest, NextResponse } from 'next/server'
import { bom } from '../../../../../lib/db/bom'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/bom/[id]/lock
 *
 * Locks a BOM by setting status='locked'.
 * Returns 404 if BOM doesn't exist.
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    const locked = await bom.lock(id)

    return NextResponse.json(
      { data: locked, message: 'BOM locked successfully' },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Not found', message: `BOM with id not found` },
        { status: 404 }
      )
    }

    console.error('Failed to lock BOM:', error)
    return NextResponse.json(
      { error: 'Failed to lock BOM', message },
      { status: 500 }
    )
  }
}
