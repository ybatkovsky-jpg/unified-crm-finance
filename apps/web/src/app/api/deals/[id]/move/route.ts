/**
 * Deal Stage Move API Endpoint
 *
 * Moves a deal to a different stage and records the transition in DealHistory.
 *
 * POST /api/deals/[id]/move
 */

import { NextRequest, NextResponse } from 'next/server'
import { deals } from '@/lib/db/deals'
import { prisma } from '@/lib/db/prisma'
import { requireSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/deals/[id]/move
 *
 * Moves a deal to a different stage and records the transition in DealHistory.
 * The actor (`changedBy`) is taken from the session — never from the request
 * body — so audit records can't be forged.
 *
 * Body:
 * - stageId: string (required) - The target stage ID
 * - comment: string (optional) - Comment for the history record
 * - lossReason: string (required when moving to a lost stage) - Reason code from LOSS_REASONS
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.stageId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'stageId is required' },
        { status: 400 }
      )
    }

    // Verify deal exists
    const existing = await deals.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Deal not found', message: `Deal with id ${id} not found` },
        { status: 404 }
      )
    }

    // Check if already in target stage
    if (existing.stageId === body.stageId) {
      return NextResponse.json(
        { error: 'No change', message: 'Deal is already in the target stage' },
        { status: 400 }
      )
    }

    // Move stage and record history (changedBy from session — can't be forged)
    await deals.moveStage(
      id,
      body.stageId,
      session.id,
      body.comment,
      body.lossReason
    )

    // Fetch full deal with relations for the response (kanban card needs stage/contact/manager)
    const fullDeal = await prisma.deal.findUnique({
      where: { id },
      include: {
        DealStage: true,
        Pipeline: true,
        Contact: true,
        User: true,
      },
    })

    if (!fullDeal) {
      return NextResponse.json(
        { error: 'Deal not found', message: `Deal with id ${id} not found` },
        { status: 404 }
      )
    }

    // Map Prisma relation names to API shape (DealData expects stage/pipeline/contact/manager)
    const { DealStage, Pipeline, Contact, User, ...dealFields } = fullDeal

    return NextResponse.json({
      data: {
        ...dealFields,
        stage: DealStage,
        pipeline: Pipeline,
        contact: Contact,
        manager: User,
      },
    })
  } catch (error) {
    console.error('Failed to move deal:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    // Validation errors (missing/invalid lossReason) → 400
    if (message.includes('lossReason is required') || message.includes('Invalid loss reason')) {
      return NextResponse.json(
        { error: 'Validation failed', message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to move deal', message },
      { status: 500 }
    )
  }
}
