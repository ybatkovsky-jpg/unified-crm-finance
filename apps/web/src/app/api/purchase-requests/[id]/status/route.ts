/**
 * PurchaseRequest Status Transition API (PROC-17)
 *
 * - PATCH /api/purchase-requests/[id]/status  body: { status }
 *   Validates the status machine: draft→sent→responded→partial/closed/cancelled.
 */

import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequests } from '../../../../lib/db/purchase-requests'
import type { PurchaseRequestStatus } from '../../../../lib/db/purchase-requests'

const VALID_STATUSES: PurchaseRequestStatus[] = [
  'draft',
  'sent',
  'responded',
  'partial',
  'closed',
  'cancelled',
]

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const body = await request.json()
    const status = body.status as PurchaseRequestStatus
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Validation failed', message: `Invalid status: ${body.status}` },
        { status: 400 }
      )
    }
    const updated = await purchaseRequests.transitionStatus(id, status)
    return NextResponse.json({ data: updated })
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (statusCode === 400 || statusCode === 404) {
      return NextResponse.json(
        { error: statusCode === 404 ? 'Not found' : 'Validation failed', message },
        { status: statusCode }
      )
    }
    console.error('Failed to transition purchase request status:', error)
    return NextResponse.json({ error: 'Failed to update status', message }, { status: 500 })
  }
}
