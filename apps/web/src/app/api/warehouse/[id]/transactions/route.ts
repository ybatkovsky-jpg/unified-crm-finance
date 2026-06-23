/**
 * Warehouse Transactions API (S06)
 *
 * - POST /api/warehouse/[id]/transactions  body: { type, quantity, bomItemId?, notes? }
 *   Apply a stock transaction (in/out/reserve/release) atomically.
 */

import { NextRequest, NextResponse } from 'next/server'
import { warehouse } from '../../../../../lib/db/warehouse'
import type { TransactionInput } from '../../../../../lib/db/warehouse'

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
    if (!body.type || body.quantity === undefined) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'type and quantity are required' },
        { status: 400 }
      )
    }
    const input: TransactionInput = {
      type: body.type,
      quantity: Number(body.quantity),
      bomItemId: body.bomItemId,
      notes: body.notes,
    }
    const result = await warehouse.applyTransaction(id, input)
    return NextResponse.json({ data: result.transaction, item: result.item }, { status: 201 })
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (status === 400 || status === 404) {
      return NextResponse.json(
        { error: status === 404 ? 'Not found' : 'Validation failed', message },
        { status }
      )
    }
    console.error('Failed to apply warehouse transaction:', error)
    return NextResponse.json({ error: 'Failed to apply transaction', message }, { status: 500 })
  }
}
