/**
 * PurchaseRequest Send API (log-based, PROC-15)
 *
 * - POST /api/purchase-requests/[id]/send
 *   Builds email if missing, writes an EmailLog (outbound), flips draft→sent.
 */

import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequests } from '../../../../lib/db/purchase-requests'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const { request } = await purchaseRequests.send(id)
    return NextResponse.json({ data: request })
  } catch (error) {
    return mapActionError(error, 'send purchase request')
  }
}

function mapActionError(error: unknown, action: string): NextResponse {
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
