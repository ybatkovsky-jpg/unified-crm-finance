/**
 * PurchaseRequest Resend API (PROC-16)
 *
 * - POST /api/purchase-requests/[id]/resend
 *   Writes a new EmailLog and refreshes sentAt. Allowed from sent/responded/partial.
 */

import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequests } from '../../../../../lib/db/purchase-requests'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const { request } = await purchaseRequests.resend(id)
    return NextResponse.json({ data: request })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (status === 400 || status === 404) {
      return NextResponse.json(
        { error: status === 404 ? 'Not found' : 'Validation failed', message },
        { status }
      )
    }
    console.error('Failed to resend purchase request:', error)
    return NextResponse.json({ error: 'Failed to resend purchase request', message }, { status: 500 })
  }
}
