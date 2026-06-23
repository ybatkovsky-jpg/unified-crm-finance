/**
 * ApprovalRequest Decide API (PROC-30)
 *
 * - POST /api/approvals/[id]/decide  body: { decision: 'approved'|'rejected', decidedBy, comment? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { approvals } from '../../../../../lib/db/approvals'
import type { ApprovalDecisionInput } from '../../../../../lib/db/approvals'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const body = await request.json()
    if (!body.decision || !body.decidedBy) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'decision and decidedBy are required' },
        { status: 400 }
      )
    }
    const input: ApprovalDecisionInput = {
      decision: body.decision,
      decidedBy: body.decidedBy,
      comment: body.comment,
    }
    const updated = await approvals.decide(id, input)
    return NextResponse.json({ data: updated })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (status === 400 || status === 404) {
      return NextResponse.json(
        { error: status === 404 ? 'Not found' : 'Validation failed', message },
        { status }
      )
    }
    console.error('Failed to decide approval:', error)
    return NextResponse.json({ error: 'Failed to decide approval', message }, { status: 500 })
  }
}
