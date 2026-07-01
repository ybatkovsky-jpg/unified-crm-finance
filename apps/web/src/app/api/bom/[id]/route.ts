/**
 * Single BOM API Endpoint
 *
 * CRUD API for individual BOM by ID:
 * - GET: Fetch a single BOM with items + computed total
 * - PATCH: Update BOM metadata (status, sourceFileId)
 * - DELETE: Hard-delete a BOM (cascades to BOMItems)
 *
 * GET /api/bom/[id]
 * PATCH /api/bom/[id]
 * DELETE /api/bom/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { bom } from '../../../../lib/db/bom'
import type { BOMUpdateInput } from '../../../../lib/db/bom'
import type { BOM, BOMItem } from '@prisma/client'
import { getSession } from '@/lib/auth/session'
import { canModify } from '@/lib/auth/permissions'
import { getProjectManagerId } from '@/lib/db/projects'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/bom/[id]
 *
 * Fetches a single BOM by ID with items and computed total.
 * Returns 404 if BOM doesn't exist.
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

    const result = await bom.findById(id, true)

    if (!result) {
      return NextResponse.json(
        { error: 'Not found', message: `BOM with id ${id} not found` },
        { status: 404 }
      )
    }

    const items = (result as BOM & { BOMItem?: BOMItem[] }).BOMItem
    const total = items?.reduce(
      (sum, item) =>
        sum + (item.quantity || 0) * Number(item.price || 0),
      0
    ) ?? 0

    return NextResponse.json({ data: result, total })
  } catch (error) {
    console.error('Failed to fetch BOM:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch BOM',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/bom/[id]
 *
 * Updates BOM metadata (status, sourceFileId).
 * Returns 404 if BOM doesn't exist.
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

    const updateData: BOMUpdateInput = {}

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await bom.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'BOM not found' }, { status: 404 })
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (body.status !== undefined) updateData.status = body.status
    if (body.sourceFileId !== undefined) updateData.sourceFileId = body.sourceFileId

    const updated = await bom.update(id, updateData)

    return NextResponse.json({ data: updated }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Not found', message: `BOM with id not found` },
        { status: 404 }
      )
    }

    console.error('Failed to update BOM:', error)
    return NextResponse.json(
      { error: 'Failed to update BOM', message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/bom/[id]
 *
 * Hard-deletes a BOM and all its BOMItems (cascade).
 * Returns 404 if BOM doesn't exist.
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

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await bom.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'BOM not found' }, { status: 404 })
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deleted = await bom.delete(id)

    return NextResponse.json(
      { data: deleted, message: 'BOM deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Not found', message: `BOM with id not found` },
        { status: 404 }
      )
    }

    console.error('Failed to delete BOM:', error)
    return NextResponse.json(
      { error: 'Failed to delete BOM', message },
      { status: 500 }
    )
  }
}
