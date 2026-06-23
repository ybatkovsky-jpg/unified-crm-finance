/**
 * Delivery Status Transition API (S07)
 *
 * - PATCH /api/deliveries/[id]/status  body: { status }
 *   pending→shipped→in_transit→delivered (+ cancelled). delivered auto-updates warehouse.
 */

import { NextRequest, NextResponse } from 'next/server'
import { deliveries } from '../../../../../lib/db/deliveries'
import type { DeliveryStatus } from '../../../../../lib/db/deliveries'

const VALID_STATUSES: DeliveryStatus[] = ['pending', 'shipped', 'in_transit', 'delivered', 'cancelled']

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
    const status = body.status as DeliveryStatus
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Validation failed', message: `Invalid status: ${body.status}` },
        { status: 400 }
      )
    }
    const updated = await deliveries.transitionStatus(id, status)
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
    console.error('Failed to transition delivery status:', error)
    return NextResponse.json({ error: 'Failed to update status', message }, { status: 500 })
  }
}
