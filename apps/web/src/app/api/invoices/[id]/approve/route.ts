/**
 * Invoice Approve API (PROC-25)
 *
 * - POST /api/invoices/[id]/approve  → set status 'approved' (from verified/discrepancy)
 */

import { NextRequest, NextResponse } from 'next/server'
import { invoices } from '../../../../../lib/db/invoices'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const approved = await invoices.approve(id)
    return NextResponse.json({ data: approved })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (status === 400 || status === 404) {
      return NextResponse.json(
        { error: status === 404 ? 'Not found' : 'Validation failed', message },
        { status }
      )
    }
    console.error('Failed to approve invoice:', error)
    return NextResponse.json({ error: 'Failed to approve invoice', message }, { status: 500 })
  }
}
