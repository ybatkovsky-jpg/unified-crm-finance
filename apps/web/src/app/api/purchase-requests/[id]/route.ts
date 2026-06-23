/**
 * Single PurchaseRequest API
 *
 * - GET    /api/purchase-requests/[id]   → request + supplier + project + items
 * - PATCH  /api/purchase-requests/[id]   → update metadata (email fields, notes)
 * - DELETE /api/purchase-requests/[id]   → delete (cascades items)
 */

import { NextRequest, NextResponse } from 'next/server'
import { purchaseRequests } from '../../../../lib/db/purchase-requests'
import type { PurchaseRequestUpdateInput } from '../../../../lib/db/purchase-requests'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const result = await purchaseRequests.findById(id, true)
    if (!result) {
      return NextResponse.json(
        { error: 'Not found', message: `PurchaseRequest ${id} not found` },
        { status: 404 }
      )
    }
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Failed to fetch purchase request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase request', message: error instanceof Error ? error.message : 'Unknown error' },
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
    const updateData: PurchaseRequestUpdateInput = {}
    for (const key of ['emailTo', 'emailSubject', 'emailBody', 'notes'] as const) {
      if (body[key] !== undefined) updateData[key] = body[key]
    }
    const updated = await purchaseRequests.update(id, updateData)
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
    console.error('Failed to update purchase request:', error)
    return NextResponse.json({ error: 'Failed to update purchase request', message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const deleted = await purchaseRequests.delete(id)
    return NextResponse.json({ data: deleted, message: 'Purchase request deleted' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Not found', message: 'Purchase request not found' }, { status: 404 })
    }
    console.error('Failed to delete purchase request:', error)
    return NextResponse.json({ error: 'Failed to delete purchase request', message }, { status: 500 })
  }
}
