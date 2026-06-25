/**
 * Productions Collection API Endpoint
 *
 * API for managing productions within a project:
 * - GET: List all productions for a project (with stages)
 * - POST: Create new production (validates unique projectId)
 *
 * GET /api/projects/[id]/productions
 * POST /api/projects/[id]/productions
 */

import { NextRequest, NextResponse } from 'next/server'
import { productions } from '@/lib/db/production'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/projects/[id]/productions
 *
 * Returns all productions for a specific project (if not soft-deleted).
 * Includes production stages ordered by sequence.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params

    // Verify project exists
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', message: `Project with id ${projectId} not found` },
        { status: 404 }
      )
    }

    const projectProductions = await productions.findMany({
      where: { projectId },
      include: {
        ProductionStage: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: projectProductions })
  } catch (error) {
    console.error('Failed to fetch productions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch productions', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects/[id]/productions
 *
 * Creates a new production for a project.
 * Validates that the project exists and is not soft-deleted.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params
    const body = await request.json()

    // Verify project exists
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found', message: `Project with id ${projectId} not found` },
        { status: 404 }
      )
    }

    // Store production type in attributes if provided
    const productionData: Record<string, unknown> = {
      projectId,
      status: body.status || 'planning',
      notes: body.notes || null,
      attributes: body.attributes || (body.type ? { type: body.type } : null),
    }

    // Create production
    const newProduction = await productions.create(productionData)

    // Fetch with stages for response
    const productionWithStages = await productions.findUnique(newProduction.id, {
      ProductionStage: {
        orderBy: { order: 'asc' },
      },
    })

    return NextResponse.json({ data: productionWithStages }, { status: 201 })
  } catch (error) {
    console.error('Failed to create production:', error)
    return NextResponse.json(
      { error: 'Failed to create production', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
