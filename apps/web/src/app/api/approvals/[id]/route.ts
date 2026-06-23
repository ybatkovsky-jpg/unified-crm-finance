/**
 * Single ApprovalRequest API
 *
 * - GET /api/approvals/[id]  → request with resolved requester/decider
 */

import { NextRequest, NextResponse } from 'next/server'
import { approvals } from '../../../../lib/db/approvals'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const result = await approvals.findById(id)
    if (!result) {
      return NextResponse.json({ error: 'Not found', message: `Approval ${id} not found` }, { status: 404 })
    }
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Failed to fetch approval:', error)
    return NextResponse.json(
      { error: 'Failed to fetch approval', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
