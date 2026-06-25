/**
 * Single Deal API Endpoint
 *
 * CRUD API for a single Deal:
 * - GET: Fetch a deal by ID
 * - PATCH: Update a deal
 * - DELETE: Soft delete a deal
 *
 * GET /api/deals/[id]
 * PATCH /api/deals/[id]
 * DELETE /api/deals/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { deals } from '@/lib/db/deals'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/deals/[id]
 *
 * Returns a single deal by ID (if not soft-deleted).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const deal = await deals.findUnique(id, {
      DealStage: true,
      Pipeline: true,
      Contact: true,
      User: true,
      DrawingFile: true,
      ActFile: true,
      DealHistory: {
        orderBy: { changedAt: 'desc' },
      },
    })

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found', message: `Deal with id ${id} not found` },
        { status: 404 }
      )
    }

    // Map Prisma PascalCase relations to API lowercase shape
    const { DealStage, Pipeline, Contact, User, DrawingFile, ActFile, DealHistory, ...rest } =
      deal as Record<string, unknown> & { DealStage?: unknown; Pipeline?: unknown; Contact?: unknown; User?: unknown; DrawingFile?: unknown; ActFile?: unknown; DealHistory?: unknown }
    const mapped = {
      ...rest,
      stage: DealStage ?? null,
      pipeline: Pipeline ?? null,
      contact: Contact ?? null,
      manager: User ?? null,
      drawingFile: DrawingFile ?? null,
      actFile: ActFile ?? null,
      history: DealHistory ?? [],
    }

    return NextResponse.json({ data: mapped })
  } catch (error) {
    console.error('Failed to fetch deal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deal', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/deals/[id]
 *
 * Updates an existing deal.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify deal exists
    const existing = await deals.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Deal not found', message: `Deal with id ${id} not found` },
        { status: 404 }
      )
    }

    // Prepare update data (only allow specific fields)
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.expectedCloseDate !== undefined) updateData.expectedCloseDate = body.expectedCloseDate
    if (body.description !== undefined) updateData.description = body.description
    if (body.lossReason !== undefined) updateData.lossReason = body.lossReason
    if (body.attributes !== undefined) updateData.attributes = body.attributes
    if (body.contactId !== undefined) updateData.contactId = body.contactId
    if (body.managerId !== undefined) updateData.managerId = body.managerId
    if (body.drawingFileId !== undefined) updateData.drawingFileId = body.drawingFileId
    if (body.actFileId !== undefined) updateData.actFileId = body.actFileId

    // If stageId is provided, use moveStage instead (to record history)
    if (body.stageId && body.stageId !== existing.stageId) {
      // For stage changes, use the /move endpoint
      return NextResponse.json(
        { error: 'Use /move endpoint', message: 'To change stage, use POST /api/deals/[id]/move' },
        { status: 400 }
      )
    }

    const updatedDeal = await deals.update(id, updateData)

    return NextResponse.json({ data: updatedDeal })
  } catch (error) {
    console.error('Failed to update deal:', error)
    return NextResponse.json(
      { error: 'Failed to update deal', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/deals/[id]
 *
 * Soft deletes a deal by setting deletedAt timestamp.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const deletedDeal = await deals.softDelete(id)

    return NextResponse.json({ data: deletedDeal })
  } catch (error) {
    console.error('Failed to delete deal:', error)
    return NextResponse.json(
      { error: 'Failed to delete deal', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
