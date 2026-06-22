/**
 * Production Stages Collection API Endpoint
 *
 * API for managing production stages:
 * - GET: List all stages for a production
 * - POST: Create new stage for a production
 *
 * GET /api/productions/[id]/stages
 * POST /api/productions/[id]/stages
 */

import { NextRequest, NextResponse } from 'next/server'
import { productions } from '@/lib/db/production'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/productions/[id]/stages
 *
 * Returns all stages for a specific production, ordered by sequence.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: productionId } = await params

    // Verify production exists
    const production = await productions.findUnique(productionId)
    if (!production) {
      return NextResponse.json(
        { error: 'Production not found', message: `Production with id ${productionId} not found` },
        { status: 404 }
      )
    }

    const stages = await productions.findStages(productionId)

    return NextResponse.json({ data: stages })
  } catch (error) {
    console.error('Failed to fetch production stages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch production stages', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/productions/[id]/stages
 *
 * Creates a new stage for a production.
 * Validates that the production exists and is not soft-deleted.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: productionId } = await params
    const body = await request.json()

    // Verify production exists
    const production = await productions.findUnique(productionId)
    if (!production) {
      return NextResponse.json(
        { error: 'Production not found', message: `Production with id ${productionId} not found` },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Stage name is required' },
        { status: 400 }
      )
    }

    if (body.order === undefined || body.order === null) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Stage order is required' },
        { status: 400 }
      )
    }

    // Create stage with productionId from route
    const newStage = await productions.createStage({
      ...body,
      productionId,
    })

    return NextResponse.json({ data: newStage }, { status: 201 })
  } catch (error) {
    console.error('Failed to create production stage:', error)
    return NextResponse.json(
      { error: 'Failed to create production stage', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
