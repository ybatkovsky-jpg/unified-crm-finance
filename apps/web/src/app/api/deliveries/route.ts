/**
 * Delivery Collection API (S07)
 *
 * - GET  /api/deliveries?projectId=&supplierId=&status=  → list
 * - POST /api/deliveries                                  → create (typically from an invoice)
 */

import { NextRequest, NextResponse } from 'next/server'
import { deliveries } from '../../../lib/db/deliveries'
import type { DeliveryCreateInput } from '../../../lib/db/deliveries'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sp = request.nextUrl.searchParams
    const data = await deliveries.findMany({
      projectId: sp.get('projectId') ?? undefined,
      supplierId: sp.get('supplierId') ?? undefined,
      status: sp.get('status') ?? undefined,
    })
    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Failed to list deliveries:', error)
    return NextResponse.json(
      { error: 'Failed to list deliveries', message: error instanceof Error ? error.message : 'Unknown error' },
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
    const createData: DeliveryCreateInput = {
      projectId: body.projectId,
      supplierId: body.supplierId,
      invoiceId: body.invoiceId,
      trackingNumber: body.trackingNumber,
      carrier: body.carrier,
      estimatedDate: body.estimatedDate ? new Date(body.estimatedDate) : undefined,
      notes: body.notes,
    }
    const created = await deliveries.create(createData)
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (status === 400 || status === 404 || status === 409) {
      const label = status === 404 ? 'Not found' : status === 409 ? 'Conflict' : 'Validation failed'
      return NextResponse.json({ error: label, message }, { status })
    }
    console.error('Failed to create delivery:', error)
    return NextResponse.json({ error: 'Failed to create delivery', message }, { status: 500 })
  }
}
