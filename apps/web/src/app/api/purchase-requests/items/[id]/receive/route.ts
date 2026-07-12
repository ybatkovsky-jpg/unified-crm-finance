/**
 * PurchaseRequest Item Status API
 *
 * PATCH /api/purchase-requests/items/[id]/receive — mark item as received
 * Creates a warehouse transaction (in) for the received goods.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { randomUUID } from 'node:crypto'
import { getSession } from '@/lib/auth/session'
import { canModify } from '@/lib/auth/permissions'
import { getProjectManagerId } from '@/lib/db/projects'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    // Find the item
    const item = await prisma.purchaseRequestItem.findUnique({
      where: { id },
      include: {
        BOMItem: { include: { BOM: true } },
        PurchaseRequest: true,
      },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Not found', message: 'PurchaseRequestItem not found' },
        { status: 404 }
      )
    }

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const managerId = item.PurchaseRequest?.projectId
      ? await getProjectManagerId(item.PurchaseRequest.projectId)
      : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (item.itemStatus === 'received') {
      return NextResponse.json(
        { error: 'Already received', message: 'This item has already been received' },
        { status: 409 }
      )
    }

    // Update item status to received
    const updated = await prisma.purchaseRequestItem.update({
      where: { id },
      data: { itemStatus: 'received' },
      include: { BOMItem: true },
    })

    // Try to create a warehouse transaction for the received goods
    try {
      // Look for an existing warehouse item matching the BOM item name/article
      const bomItemName = item.BOMItem?.name
      if (bomItemName) {
        let warehouseItem = await prisma.warehouseItem.findFirst({
          where: {
            OR: [
              { name: bomItemName },
              ...(item.BOMItem?.article ? [{ article: item.BOMItem.article }] : []),
            ],
          },
        })

        // If no warehouse item exists, create one
        if (!warehouseItem) {
          warehouseItem = await prisma.warehouseItem.create({
            data: {
              id: randomUUID(),
              name: bomItemName,
              article: item.BOMItem?.article ?? null,
              category: item.BOMItem?.category ?? null,
              quantity: 0,
              reservedQty: 0,
              availableQty: 0,
              unit: item.BOMItem?.unit ?? 'шт',
              updatedAt: new Date(),
            },
          })
        }

        // Apply "in" transaction
        const newQty = warehouseItem.quantity + item.quantity
        const newAvailable = newQty - warehouseItem.reservedQty
        await prisma.warehouseItem.update({
          where: { id: warehouseItem.id },
          data: {
            quantity: newQty,
            availableQty: newAvailable,
            updatedAt: new Date(),
          },
        })

        await prisma.warehouseTransaction.create({
          data: {
            id: randomUUID(),
            warehouseItemId: warehouseItem.id,
            bomItemId: item.bomItemId,
            type: 'in',
            quantity: item.quantity,
            notes: `Приёмка по PR ${item.PurchaseRequest.number}`,
          },
        })
      }
    } catch {
      // Non-critical: warehouse update failure shouldn't block status update
    }

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Failed to receive item:', error)
    return NextResponse.json(
      { error: 'Failed to receive item', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
