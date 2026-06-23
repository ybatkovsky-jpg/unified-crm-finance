/**
 * BOM Unlock API Endpoint
 *
 * Unlock a BOM to allow edits:
 * - POST: Set BOM status to 'draft'
 *
 * POST /api/bom/[id]/unlock
 */

import { NextRequest, NextResponse } from 'next/server'
import { bom } from '../../../../../lib/db/bom'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/bom/[id]/unlock
 *
 * Unlocks a BOM by setting status='draft'.
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

    const unlocked = await bom.unlock(id)

    return NextResponse.json(
      { data: unlocked, message: 'BOM unlocked successfully' },
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

    console.error('Failed to unlock BOM:', error)
    return NextResponse.json(
      { error: 'Failed to unlock BOM', message },
      { status: 500 }
    )
  }
}
