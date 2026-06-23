/**
 * Warehouse Collection API (S06)
 *
 * - GET  /api/warehouse?search=&lowStockOnly=1  → list items
 * - POST /api/warehouse                          → create item
 */

import { NextRequest, NextResponse } from 'next/server'
import { warehouse } from '../../../lib/db/warehouse'
import type { WarehouseItemCreateInput } from '../../../lib/db/warehouse'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sp = request.nextUrl.searchParams
    const data = await warehouse.findMany({
      search: sp.get('search') ?? undefined,
      lowStockOnly: sp.get('lowStockOnly') === '1',
    })
    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Failed to list warehouse items:', error)
    return NextResponse.json(
      { error: 'Failed to list items', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    if (!body.name) {
      return NextResponse.json({ error: 'Validation failed', message: 'name is required' }, { status: 400 })
    }
    const createData: WarehouseItemCreateInput = {
      name: body.name,
      article: body.article,
      category: body.category,
      quantity: body.quantity,
      reservedQty: body.reservedQty,
      minQuantity: body.minQuantity,
      unit: body.unit,
      location: body.location,
    }
    const created = await warehouse.create(createData)
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (status === 400) {
      return NextResponse.json({ error: 'Validation failed', message }, { status: 400 })
    }
    console.error('Failed to create warehouse item:', error)
    return NextResponse.json({ error: 'Failed to create item', message }, { status: 500 })
  }
}
