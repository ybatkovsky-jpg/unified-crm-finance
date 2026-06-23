/**
 * Invoice Item Match API (PROC-24)
 *
 * - POST /api/invoices/items/[id]/match  body: { bomItemId }
 *   Links an invoice line to an ordered (BOM) item.
 */

import { NextRequest, NextResponse } from 'next/server'
import { invoices } from '../../../../../../lib/db/invoices'

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
    if (!body.bomItemId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'bomItemId is required' },
        { status: 400 }
      )
    }
    const matched = await invoices.matchItem(id, body.bomItemId)
    return NextResponse.json({ data: matched })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (status === 400 || status === 404) {
      return NextResponse.json(
        { error: status === 404 ? 'Not found' : 'Validation failed', message },
        { status }
      )
    }
    console.error('Failed to match invoice item:', error)
    return NextResponse.json({ error: 'Failed to match item', message }, { status: 500 })
  }
}
