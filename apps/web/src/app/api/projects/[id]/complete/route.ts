/**
 * Project Complete with Cascade API Endpoint
 *
 * POST /api/projects/[id]/complete
 *
 * Completes a project and cascades the completion to the related Deal.
 * Validates all project stages are completed first.
 * Uses Prisma transaction to atomically update both Project and Deal.
 */

import { NextRequest, NextResponse } from 'next/server'
import { projects } from '@/lib/db/projects'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/projects/[id]/complete
 *
 * Completes a project and cascades the completion to the related Deal.
 * Body: { userId: string } - The user ID performing the completion (for DealHistory)
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

    // Call completeWithCascade which validates stages and uses transaction
    const result = await projects.completeWithCascade(id, userId)

    return NextResponse.json({
      data: {
        project: result.project,
        deal: result.deal,
      },
    })
  } catch (error) {
    console.error('Failed to complete project:', error)

    // Determine appropriate status code based on error
    let status = 500
    let errorMessage = 'Unknown error'

    if (error instanceof Error) {
      errorMessage = error.message

      // Return 400 for validation errors (incomplete stages)
      if (errorMessage.includes('Cannot complete project') || errorMessage.includes('incomplete stages')) {
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
