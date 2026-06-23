/**
 * PurchaseRequest Items API
 *
 * - GET  /api/purchase-requests/[id]/items  → list items (with BOMItem)
 * - POST /api/purchase-requests/[id]/items  → add an item
 */

import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequests } from '../../../../../lib/db/purchase-requests'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const items = await purchaseRequests.findItems(id)
    return NextResponse.json({ data: items, count: items.length })
  } catch (error) {
    console.error('Failed to list purchase request items:', error)
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
    if (!body.bomItemId || body.quantity === undefined) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'bomItemId and quantity are required' },
        { status: 400 }
      )
    }
    const item = await purchaseRequests.addItem(id, {
      bomItemId: body.bomItemId,
      quantity: Number(body.quantity),
      price: body.price,
      available: body.available,
      availableQty: body.availableQty,
      deliveryDays: body.deliveryDays,
      notes: body.notes,
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
    console.error('Failed to add purchase request item:', error)
    return NextResponse.json({ error: 'Failed to add item', message }, { status: 500 })
  }
}
