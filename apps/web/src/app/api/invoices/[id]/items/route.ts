/**
 * Invoice Items API
 *
 * - GET  /api/invoices/[id]/items  → list items (with BOMItem)
 * - POST /api/invoices/[id]/items  → add an item
 */

import { NextRequest, NextResponse } from 'next/server'
import { invoices } from '../../../../../lib/db/invoices'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const items = await invoices.findItems(id)
    return NextResponse.json({ data: items, count: items.length })
  } catch (error) {
    console.error('Failed to list invoice items:', error)
    return NextResponse.json(
      { error: 'Failed to list items', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const body = await request.json()
    if (!body.name || body.quantity === undefined) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'name and quantity are required' },
        { status: 400 }
      )
    }
    const item = await invoices.addItem(id, {
      name: body.name,
      quantity: Number(body.quantity),
      price: body.price,
      bomItemId: body.bomItemId,
      isMatch: body.isMatch,
      mismatchReason: body.mismatchReason,
    })
    return NextResponse.json({ data: item }, { status: 201 })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (status === 400 || status === 404) {
      return NextResponse.json(
        { error: status === 404 ? 'Not found' : 'Validation failed', message },
        { status }
      )
    }
    console.error('Failed to add invoice item:', error)
    return NextResponse.json({ error: 'Failed to add item', message }, { status: 500 })
  }
}
