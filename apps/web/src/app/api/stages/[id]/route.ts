/**
 * Single ProductionStage API Endpoint
 *
 * CRUD API for a single ProductionStage:
 * - GET: Fetch a stage by ID
 * - PATCH: Update stage status, dates, completedAt
 * - DELETE: Delete a stage (hard delete)
 *
 * GET /api/stages/[id]
 * PATCH /api/stages/[id]
 * DELETE /api/stages/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { productions } from '@/lib/db/production'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/stages/[id]
 *
 * Returns a single production stage by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const stage = await productions.findStage(id)

    if (!stage) {
      return NextResponse.json(
        { error: 'ProductionStage not found', message: `ProductionStage with id ${id} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: stage })
  } catch (error) {
    console.error('Failed to fetch production stage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch production stage', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/stages/[id]
 *
 * Updates an existing production stage.
 * Allowed fields: name, order, status, startDate, endDate, completedAt, notes.
 * Automatically sets completedAt when status becomes 'completed'.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify stage exists
    const existing = await productions.findStage(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'ProductionStage not found', message: `ProductionStage with id ${id} not found` },
        { status: 404 }
      )
    }

    // Prepare update data (only allow specific fields)
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.order !== undefined) updateData.order = body.order
    if (body.startDate !== undefined) updateData.startDate = body.startDate
    if (body.endDate !== undefined) updateData.endDate = body.endDate
    if (body.notes !== undefined) updateData.notes = body.notes

    // Handle status change with completedAt logic
    if (body.status !== undefined) {
      if (body.status === 'completed' && existing.status !== 'completed') {
        // Moving to completed status - set completedAt if not provided
        updateData.completedAt = body.completedAt ?? new Date()
      }
      updateData.status = body.status
    }

    const updatedStage = await productions.updateStage(id, updateData)

    return NextResponse.json({ data: updatedStage })
  } catch (error) {
    console.error('Failed to update production stage:', error)
    return NextResponse.json(
      { error: 'Failed to update production stage', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/stages/[id]
 *
 * Deletes a production stage (hard delete).
 * Stages do not support soft-delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const deletedStage = await productions.deleteStage(id)

    return NextResponse.json({ data: deletedStage })
  } catch (error) {
    console.error('Failed to delete production stage:', error)
    return NextResponse.json(
      { error: 'Failed to delete production stage', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
