/**
 * Single Delivery API
 *
 * - GET   /api/deliveries/[id]  → delivery with supplier/project/invoice
 * - PATCH /api/deliveries/[id]  → update tracking metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { deliveries } from '../../../../lib/db/deliveries'
import type { DeliveryUpdateInput } from '../../../../lib/db/deliveries'
import { getSession } from '@/lib/auth/session'
import { canModify } from '@/lib/auth/permissions'
import { getProjectManagerId } from '@/lib/db/projects'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const result = await deliveries.findById(id)
    if (!result) {
      return NextResponse.json({ error: 'Not found', message: `Delivery ${id} not found` }, { status: 404 })
    }
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Failed to fetch delivery:', error)
    return NextResponse.json(
      { error: 'Failed to fetch delivery', message: error instanceof Error ? error.message : 'Unknown error' },
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
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await deliveries.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Delivery not found' }, { status: 404 })
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const updateData: DeliveryUpdateInput = {}
    for (const key of ['deliveryType', 'trackingNumber', 'carrier', 'fromLocation', 'toLocation', 'notes'] as const) {
      if (body[key] !== undefined) updateData[key] = body[key]
    }
    if (body.cost !== undefined) {
      updateData.cost = body.cost ?? null
    }
    if (body.estimatedDate !== undefined) {
      updateData.estimatedDate = body.estimatedDate ? new Date(body.estimatedDate) : null
    }
    const updated = await deliveries.update(id, updateData)
    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Not found', message: 'Delivery not found' }, { status: 404 })
    }
    console.error('Failed to update delivery:', error)
    return NextResponse.json({ error: 'Failed to update delivery', message }, { status: 500 })
  }
}
