/**
 * Single Invoice Item API
 *
 * - PATCH  /api/invoices/items/[id]  → update item (name/qty/price)
 * - DELETE /api/invoices/items/[id]  → remove item
 */

import { NextRequest, NextResponse } from 'next/server'
import { invoices } from '../../../../../lib/db/invoices'

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
    const updated = await invoices.updateItem(id, {
      name: body.name,
      quantity: body.quantity,
      price: body.price,
    })
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
    console.error('Failed to update invoice item:', error)
    return NextResponse.json({ error: 'Failed to update item', message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const deleted = await invoices.removeItem(id)
    return NextResponse.json({ data: deleted, message: 'Item removed' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Not found', message: 'Item not found' }, { status: 404 })
    }
    console.error('Failed to remove invoice item:', error)
    return NextResponse.json({ error: 'Failed to remove item', message }, { status: 500 })
  }
}
