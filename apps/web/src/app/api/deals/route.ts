/**
 * Deals Collection API Endpoint
 *
 * CRUD API for Deal model:
 * - GET: List all deals (excluding soft-deleted) with optional filters
 * - POST: Create a new deal
 *
 * GET /api/deals
 * POST /api/deals
 */

import { NextRequest, NextResponse } from 'next/server'
import { deals } from '../../../lib/db/deals'
import { mapErrorToResponse } from '../../../lib/api/error-mapping'

/**
 * GET /api/deals
 *
 * Returns all active deals (excludes soft-deleted).
 * Supports optional query parameters for filtering.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const pipelineId = searchParams.get('pipelineId')
    const stageId = searchParams.get('stageId')
    const managerId = searchParams.get('managerId')
    const contactId = searchParams.get('contactId')
    const status = searchParams.get('status') // For filtering open/closed deals

    const where: Record<string, unknown> = {}
    if (pipelineId) where.pipelineId = pipelineId
    if (stageId) where.stageId = stageId
    if (managerId) where.managerId = managerId
    if (contactId) where.contactId = contactId

    // Filter by open/closed status
    if (status === 'open') {
      where.closedAt = null
    } else if (status === 'closed') {
      where.closedAt = { not: null }
    }

    const allDeals = await deals.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        DealStage: true,
        Pipeline: true,
        Contact: true,
        User: true,
      },
    })

    // Map Prisma PascalCase relations to API lowercase shape
    const mapped = allDeals.map((deal) => {
      const { DealStage, Pipeline, Contact, User, ...rest } = deal as Record<string, unknown> & { DealStage?: unknown; Pipeline?: unknown; Contact?: unknown; User?: unknown }
      return {
        ...rest,
        stage: DealStage ?? null,
        pipeline: Pipeline ?? null,
        contact: Contact ?? null,
        manager: User ?? null,
      }
    })

    return NextResponse.json({ data: mapped, count: mapped.length })
  } catch (error) {
    console.error('Failed to fetch deals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deals', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/deals
 *
 * Creates a new deal.
 * Validates required fields.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'title is required' },
        { status: 400 }
      )
    }

    if (!body.pipelineId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'pipelineId is required' },
        { status: 400 }
      )
    }

    if (!body.stageId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'stageId is required' },
        { status: 400 }
      )
    }

    // Prepare creation data
    const createData = {
      title: body.title,
      pipelineId: body.pipelineId,
      stageId: body.stageId,
      contactId: body.contactId || null,
      amount: body.amount ?? 0,
      currency: body.currency ?? 'RUB',
      expectedCloseDate: body.expectedCloseDate || null,
      managerId: body.managerId || null,
      description: body.description || null,
      lossReason: body.lossReason || null,
      attributes: body.attributes || null,
    }

    const newDeal = await deals.create(createData)

    return NextResponse.json({ data: newDeal }, { status: 201 })
  } catch (error) {
    return mapErrorToResponse(error, 'create deal')
  }
}
