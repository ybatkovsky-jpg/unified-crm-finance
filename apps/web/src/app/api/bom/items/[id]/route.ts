/**
 * Single BOMItem API Endpoint
 *
 * CRUD API for individual BOMItem by ID:
 * - GET: Fetch a single BOMItem
 * - PATCH: Update item fields
 * - DELETE: Remove item from BOM
 *
 * GET /api/bom/items/[id]
 * PATCH /api/bom/items/[id]
 * DELETE /api/bom/items/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { bom } from '../../../../../lib/db/bom'
import type { BOMItemUpdateInput } from '../../../../../lib/db/bom'
import { prisma } from '../../../../../lib/db/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/bom/items/[id]
 *
 * Fetches a single BOMItem by ID.
 * Returns 404 if item doesn't exist.
 */
export async function GET(
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

    const item = await prisma.bOMItem.findUnique({ where: { id } })

    if (!item) {
      return NextResponse.json(
        { error: 'Not found', message: `BOMItem with id ${id} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('Failed to fetch BOM item:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch BOM item',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/bom/items/[id]
 *
 * Updates a single BOMItem. All fields optional.
 * Returns 404 if item doesn't exist.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    // Check if the BOM is locked (editing items of a locked BOM is forbidden)
    const existing = await prisma.bOMItem.findUnique({
      where: { id },
      include: { BOM: { select: { status: true } } },
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', message: `BOMItem with id ${id} not found` },
        { status: 404 }
      )
    }
    if (existing.BOM.status === 'locked') {
      return NextResponse.json(
        { error: 'BOM is locked', message: 'Cannot edit items of a locked BOM' },
        { status: 409 }
      )
    }

    const updateData: BOMItemUpdateInput = {}
    if (body.rowNumber !== undefined) updateData.rowNumber = body.rowNumber
    if (body.name !== undefined) updateData.name = body.name
    if (body.article !== undefined) updateData.article = body.article
    if (body.category !== undefined) updateData.category = body.category
    if (body.quantity !== undefined) updateData.quantity = body.quantity
    if (body.unit !== undefined) updateData.unit = body.unit
    if (body.price !== undefined) updateData.price = body.price
    if (body.supplierId !== undefined) updateData.supplierId = body.supplierId
    if (body.status !== undefined) updateData.status = body.status
    if (body.isFromWarehouse !== undefined) updateData.isFromWarehouse = body.isFromWarehouse
    if (body.notes !== undefined) updateData.notes = body.notes

    const updated = await bom.updateItem(id, updateData)

    return NextResponse.json({ data: updated }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Not found', message: `BOMItem with id not found` },
        { status: 404 }
      )
    }

    console.error('Failed to update BOM item:', error)
    return NextResponse.json(
      { error: 'Failed to update BOM item', message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/bom/items/[id]
 *
 * Deletes a single BOMItem.
 * Returns 404 if item doesn't exist.
 */
export async function DELETE(
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

    const deleted = await bom.deleteItem(id)

    return NextResponse.json(
      { data: deleted, message: 'BOMItem deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Not found', message: `BOMItem with id not found` },
        { status: 404 }
      )
    }

    console.error('Failed to delete BOM item:', error)
    return NextResponse.json(
      { error: 'Failed to delete BOM item', message },
      { status: 500 }
    )
  }
}
