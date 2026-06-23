/**
 * Single PurchaseRequest Item API
 *
 * - DELETE /api/purchase-requests/items/[id]  → remove an item
 */

import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequests } from '../../../../../lib/db/purchase-requests'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const deleted = await purchaseRequests.removeItem(id)
    return NextResponse.json({ data: deleted, message: 'Item removed' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Not found', message: 'Item not found' }, { status: 404 })
    }
    console.error('Failed to remove purchase request item:', error)
    return NextResponse.json({ error: 'Failed to remove item', message }, { status: 500 })
  }
}
