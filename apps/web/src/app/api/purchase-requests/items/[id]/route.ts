/**
 * Single PurchaseRequest Item API
 *
 * - PATCH /api/purchase-requests/items/[id] → update matching fields
 * - DELETE /api/purchase-requests/items/[id] → remove an item
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { canModify } from '@/lib/auth/permissions'
import { getProjectManagerId } from '@/lib/db/projects'

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
    const updateData: Record<string, unknown> = {}

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await prisma.purchaseRequestItem.findUnique({
      where: { id },
      include: { PurchaseRequest: { select: { projectId: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Item not found' }, { status: 404 })
    const managerId = existing.PurchaseRequest?.projectId
      ? await getProjectManagerId(existing.PurchaseRequest.projectId)
      : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (body.available !== undefined) updateData.available = body.available
    if (body.availableQty !== undefined) updateData.availableQty = body.availableQty
    if (body.deliveryDays !== undefined) updateData.deliveryDays = body.deliveryDays
    if (body.notes !== undefined) updateData.notes = body.notes

    const updated = await prisma.purchaseRequestItem.update({
      where: { id },
      data: updateData,
      include: { BOMItem: true },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'Not found', message: 'Item not found' }, { status: 404 })
    }
    console.error('Failed to update purchase request item:', error)
    return NextResponse.json({ error: 'Failed to update item', message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await prisma.purchaseRequestItem.findUnique({
      where: { id },
      include: { PurchaseRequest: { select: { projectId: true } } },
    })
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Item not found' }, { status: 404 })
    const managerId = existing.PurchaseRequest?.projectId
      ? await getProjectManagerId(existing.PurchaseRequest.projectId)
      : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await prisma.purchaseRequestItem.delete({ where: { id } })
    return NextResponse.json({ data: { id }, message: 'Item removed' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Not found', message: 'Item not found' }, { status: 404 })
    }
    console.error('Failed to remove purchase request item:', error)
    return NextResponse.json({ error: 'Failed to remove item', message }, { status: 500 })
  }
}
