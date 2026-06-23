/**
 * ApprovalRequest Collection API (S05)
 *
 * - GET  /api/approvals?status=&type=  → list
 * - POST /api/approvals                 → create (PROC-28; type='payment' from an approved invoice)
 */

import { NextRequest, NextResponse } from 'next/server'
import { approvals } from '../../../lib/db/approvals'
import type { ApprovalRequestCreateInput } from '../../../lib/db/approvals'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sp = request.nextUrl.searchParams
    const data = await approvals.findMany({
      status: sp.get('status') ?? undefined,
      type: sp.get('type') ?? undefined,
    })
    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Failed to list approvals:', error)
    return NextResponse.json(
      { error: 'Failed to list approvals', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    if (!body.type || !body.entityId || !body.requestedBy) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'type, entityId and requestedBy are required' },
        { status: 400 }
      )
    }
    const createData: ApprovalRequestCreateInput = {
      type: body.type,
      entityId: body.entityId,
      amount: body.amount,
      requestedBy: body.requestedBy,
      comment: body.comment,
      notifyUserId: body.notifyUserId,
    }
    const created = await approvals.create(createData)
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (status === 400 || status === 404) {
      return NextResponse.json(
        { error: status === 404 ? 'Not found' : 'Validation failed', message },
        { status }
      )
    }
    console.error('Failed to create approval:', error)
    return NextResponse.json({ error: 'Failed to create approval', message }, { status: 500 })
  }
}
