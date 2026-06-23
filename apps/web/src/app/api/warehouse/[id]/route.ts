/**
 * Single WarehouseItem API
 *
 * - GET    /api/warehouse/[id]  → item with transaction history
 * - PATCH  /api/warehouse/[id]  → update metadata
 * - DELETE /api/warehouse/[id]  → delete (cascades transactions)
 */

import { NextRequest, NextResponse } from 'next/server'
import { warehouse } from '../../../../lib/db/warehouse'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const result = await warehouse.findById(id, true)
    if (!result) {
      return NextResponse.json({ error: 'Not found', message: `Item ${id} not found` }, { status: 404 })
    }
    return NextResponse.json({
      data: { ...result, transactions: result.WarehouseTransaction ?? [] },
    })
  } catch (error) {
    console.error('Failed to fetch warehouse item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch item', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const body = await request.json()
    const updated = await warehouse.update(id, {
      name: body.name,
      article: body.article,
      category: body.category,
      minQuantity: body.minQuantity,
      unit: body.unit,
      location: body.location,
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Not found', message: 'Item not found' }, { status: 404 })
    }
    console.error('Failed to update warehouse item:', error)
    return NextResponse.json({ error: 'Failed to update item', message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const deleted = await warehouse.delete(id)
    return NextResponse.json({ data: deleted, message: 'Item deleted' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Not found', message: 'Item not found' }, { status: 404 })
    }
    console.error('Failed to delete warehouse item:', error)
    return NextResponse.json({ error: 'Failed to delete item', message }, { status: 500 })
  }
}
