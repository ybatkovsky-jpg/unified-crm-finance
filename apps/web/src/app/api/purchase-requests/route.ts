/**
 * PurchaseRequest Collection API
 *
 * - GET  /api/purchase-requests?projectId=&supplierId=&status=  → list with filters
 * - POST /api/purchase-requests                                  → create (optionally from a group)
 */

import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequests } from '../../../lib/db/purchase-requests'
import type { PurchaseRequestCreateInput } from '../../../lib/db/purchase-requests'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sp = request.nextUrl.searchParams
    const data = await purchaseRequests.findMany({
      projectId: sp.get('projectId') ?? undefined,
      supplierId: sp.get('supplierId') ?? undefined,
      status: sp.get('status') ?? undefined,
    })
    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Failed to list purchase requests:', error)
    return NextResponse.json(
      { error: 'Failed to list purchase requests', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    if (!body.projectId || !body.supplierId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'projectId and supplierId are required' },
        { status: 400 }
      )
    }
    const createData: PurchaseRequestCreateInput = {
      projectId: body.projectId,
      supplierId: body.supplierId,
      number: body.number,
      emailTo: body.emailTo,
      emailSubject: body.emailSubject,
      emailBody: body.emailBody,
      notes: body.notes,
      items: body.items,
    }
    const created = await purchaseRequests.create(createData)
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    return mapRepoError(error, 'create purchase request')
  }
}

/** Map repository NotFoundError(404)/ValidationError(400) to HTTP, else 500. */
function mapRepoError(error: unknown, action: string): NextResponse {
  const status = (error as { statusCode?: number }).statusCode
  const message = error instanceof Error ? error.message : 'Unknown error'
  if (status === 400 || status === 404) {
    return NextResponse.json(
      { error: status === 404 ? 'Not found' : 'Validation failed', message },
      { status }
    )
  }
  console.error(`Failed to ${action}:`, error)
  return NextResponse.json({ error: `Failed to ${action}`, message }, { status: 500 })
}
