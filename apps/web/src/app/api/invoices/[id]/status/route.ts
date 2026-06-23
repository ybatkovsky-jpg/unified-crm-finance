/**
 * Invoice Status Transition API
 *
 * - PATCH /api/invoices/[id]/status  body: { status }
 *   Explicit status transition (received/verified/discrepancy/approved).
 */

import { NextRequest, NextResponse } from 'next/server'
import { invoices } from '../../../../../lib/db/invoices'
import type { InvoiceStatus } from '../../../../../lib/db/invoices'

const VALID_STATUSES: InvoiceStatus[] = ['received', 'verified', 'discrepancy', 'approved']

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
    const status = body.status as InvoiceStatus
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Validation failed', message: `Invalid status: ${body.status}` },
        { status: 400 }
      )
    }
    const updated = await invoices.transitionStatus(id, status)
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
    console.error('Failed to transition invoice status:', error)
    return NextResponse.json({ error: 'Failed to update status', message }, { status: 500 })
  }
}
