/**
 * Single Production API Endpoint
 *
 * CRUD API for a single Production:
 * - GET: Fetch a production by ID with stages
 * - PATCH: Update production (status, progress, dates)
 * - DELETE: Soft delete production
 *
 * GET /api/productions/[id]
 * PATCH /api/productions/[id]
 * DELETE /api/productions/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { productions } from '@/lib/db/production'
import { getSession } from '@/lib/auth/session'
import { canModify } from '@/lib/auth/permissions'
import { getProjectManagerId } from '@/lib/db/projects'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/productions/[id]
 *
 * Returns a single production by ID (if not soft-deleted).
 * Includes production stages ordered by sequence.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const production = await productions.findUnique(id, {
      ProductionStage: {
        orderBy: { order: 'asc' },
      },
      Counterparty: true,
    })

    if (!production) {
      return NextResponse.json(
        { error: 'Production not found', message: `Production with id ${id} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: production })
  } catch (error) {
    console.error('Failed to fetch production:', error)
    return NextResponse.json(
      { error: 'Failed to fetch production', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/productions/[id]
 *
 * Updates an existing production.
 * Allowed fields: status, progress, plannedStartDate, plannedEndDate,
 * actualStartDate, actualEndDate, material, dimensions, notes, attributes.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify production exists
    const existing = await productions.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Production not found', message: `Production with id ${id} not found` },
        { status: 404 }
      )
    }

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data (only allow specific fields)
    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.progress !== undefined) updateData.progress = body.progress
    if (body.plannedStartDate !== undefined) updateData.plannedStartDate = body.plannedStartDate
    if (body.plannedEndDate !== undefined) updateData.plannedEndDate = body.plannedEndDate
    if (body.actualStartDate !== undefined) updateData.actualStartDate = body.actualStartDate
    if (body.actualEndDate !== undefined) updateData.actualEndDate = body.actualEndDate
    if (body.partnerId !== undefined) updateData.partnerId = body.partnerId
    if (body.materialMode !== undefined) updateData.materialMode = body.materialMode
    if (body.material !== undefined) updateData.material = body.material
    if (body.dimensions !== undefined) updateData.dimensions = body.dimensions
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.attributes !== undefined) updateData.attributes = body.attributes

    const updatedProduction = await productions.update(id, updateData)

    // Fetch with stages and partner for response
    const productionWithStages = await productions.findUnique(updatedProduction.id, {
      ProductionStage: {
        orderBy: { order: 'asc' },
      },
      Counterparty: true,
    })

    return NextResponse.json({ data: productionWithStages })
  } catch (error) {
    console.error('Failed to update production:', error)
    return NextResponse.json(
      { error: 'Failed to update production', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/productions/[id]
 *
 * Soft deletes a production by setting deletedAt timestamp.
 * Does NOT actually delete the record from database.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await productions.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Production not found', message: `Production with id ${id} not found` },
        { status: 404 }
      )
    }
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deletedProduction = await productions.softDelete(id)

    return NextResponse.json({ data: deletedProduction })
  } catch (error) {
    console.error('Failed to delete production:', error)
    return NextResponse.json(
      { error: 'Failed to delete production', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
