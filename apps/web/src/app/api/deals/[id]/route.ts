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
import { getSession } from '@/lib/auth/session'
import { canModify } from '@/lib/auth/permissions'

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
      LeadSource: { select: { id: true, code: true, name: true, description: true, isActive: true } },
      DrawingFile: true,
      ActFile: true,
      DealHistory: {
        orderBy: { changedAt: 'desc' },
        // Eager-load stage names + the user who made each change so the UI can
        // render "A → B, user, время" without extra round-trips.
        include: {
          FromStage: { select: { id: true, name: true, color: true } },
          ToStage: { select: { id: true, name: true, color: true, isWonStage: true, isLostStage: true } },
          ChangedBy: { select: { id: true, name: true, email: true } },
        },
      },
    })

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found', message: `Deal with id ${id} not found` },
        { status: 404 }
      )
    }

    // Map Prisma PascalCase relations to API lowercase shape.
    // DealHistory items also need inner PascalCase→camelCase mapping for the
    // nested relations (FromStage→fromStage, etc.).
    const { DealStage, Pipeline, Contact, User, LeadSource, DrawingFile, ActFile, DealHistory, ...rest } =
      deal as Record<string, unknown> & {
        DealStage?: unknown; Pipeline?: unknown; Contact?: unknown; User?: unknown; LeadSource?: unknown;
        DrawingFile?: unknown; ActFile?: unknown;
        DealHistory?: Array<Record<string, unknown>>;
      }
    const history = (DealHistory ?? []).map((h) => {
      const { FromStage, ToStage, ChangedBy, ...entry } = h
      return {
        ...entry,
        fromStage: FromStage ?? null,
        toStage: ToStage ?? null,
        changedByUser: ChangedBy ?? null,
      }
    })
    const mapped = {
      ...rest,
      stage: DealStage ?? null,
      pipeline: Pipeline ?? null,
      contact: Contact ?? null,
      manager: User ?? null,
      source: LeadSource ?? null,
      drawingFile: DrawingFile ?? null,
      actFile: ActFile ?? null,
      history,
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

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify deal exists
    const existing = await deals.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Deal not found', message: `Deal with id ${id} not found` },
        { status: 404 }
      )
    }

    // Админ — всё; остальные — только свои сделки.
    if (!canModify(session, existing.managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Prepare update data (coerce types from form values)
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.amount !== undefined) updateData.amount = body.amount === '' ? undefined : Number(body.amount)
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.expectedCloseDate !== undefined) updateData.expectedCloseDate = body.expectedCloseDate ? new Date(body.expectedCloseDate) : null
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.lossReason !== undefined) updateData.lossReason = body.lossReason || null
    if (body.sourceId !== undefined) updateData.sourceId = body.sourceId || null
    if (body.attributes !== undefined) updateData.attributes = body.attributes
    if (body.contactId !== undefined) updateData.contactId = body.contactId || null
    if (body.managerId !== undefined) updateData.managerId = body.managerId || null
    if (body.drawingFileId !== undefined) updateData.drawingFileId = body.drawingFileId || null
    if (body.actFileId !== undefined) updateData.actFileId = body.actFileId || null

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

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await deals.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Deal not found', message: `Deal with id ${id} not found` },
        { status: 404 }
      )
    }

    // Админ — всё; остальные — только свои сделки.
    if (!canModify(session, existing.managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
