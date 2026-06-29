/**
 * Project Complete with Cascade API Endpoint
 *
 * POST /api/projects/[id]/complete
 *
 * Completes a project and cascades the completion to the related Deal.
 * Validates all project stages are completed first.
 * Checks closure readiness (PROJ-13): act signed, client money received,
 * supplier invoices paid, designer bonus paid. Unmet conditions return 409
 * unless `overrideUnmet` is true (soft closure with override).
 * Records a 2-year warranty period on completion (PROJ-14).
 */

import { NextRequest, NextResponse } from 'next/server'
import { projects } from '@/lib/db/projects'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/projects/[id]/complete
 *
 * Body: { userId: string, overrideUnmet?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate userId is provided (required for DealHistory)
    const userId = body.userId
    if (!userId) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'userId is required for completing a project'
        },
        { status: 400 }
      )
    }

    const overrideUnmet = body.overrideUnmet === true

    // completeWithCascade validates stages, checks readiness, and records warranty.
    const result = await projects.completeWithCascade(id, userId, overrideUnmet)

    return NextResponse.json({
      data: {
        project: result.project,
        deal: result.deal,
        readiness: result.readiness,
      },
    })
  } catch (error) {
    console.error('Failed to complete project:', error)

    // Determine appropriate status code based on error
    let status = 500
    let errorMessage = 'Unknown error'

    if (error instanceof Error) {
      errorMessage = error.message

      // Closure conditions unmet without override → 409 with readiness payload.
      if (error.name === 'ConflictError') {
        status = 409
      }
      // Return 400 for validation errors (incomplete stages)
      else if (errorMessage.includes('Cannot complete project') || errorMessage.includes('incomplete stages')) {
        status = 400
      }
      // Return 404 for not found errors
      else if (errorMessage.includes('not found')) {
        status = 404
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to complete project',
        message: errorMessage,
      },
      { status }
    )
  }
}
