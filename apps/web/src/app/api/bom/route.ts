/**
 * BOM Collection API Endpoint
 *
 * CRUD API for BOM (Bill of Materials) model:
 * - GET: Fetch BOM by projectId query param, includes items
 * - POST: Create a new BOM with optional items array
 *
 * GET /api/bom?projectId=X
 * POST /api/bom
 */

import { NextRequest, NextResponse } from 'next/server'
import { bom } from '../../../lib/db/bom'
import type { BOMCreateInput } from '../../../lib/db/bom'

/**
 * GET /api/bom?projectId=X
 *
 * Returns a single BOM for the given project (projectId is unique on BOM).
 * Includes nested BOMItem array.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'projectId query parameter is required' },
        { status: 400 }
      )
    }

    const result = await bom.findByProjectId(projectId, true)

    if (!result) {
      return NextResponse.json(
        { error: 'Not found', message: `BOM for project ${projectId} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Failed to fetch BOM:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch BOM',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bom
 *
 * Creates a new BOM with auto-generated id, status='draft', version=1.
 * Optionally creates nested BOMItems via the `items` field.
 * Validates: projectId is required.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    if (!body.projectId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'projectId is required' },
        { status: 400 }
      )
    }

    const createData: BOMCreateInput = {
      projectId: body.projectId,
      sourceFileId: body.sourceFileId ?? undefined,
      items: body.items ?? undefined,
    }

    const newBOM = await bom.create(createData)

    return NextResponse.json({ data: newBOM }, { status: 201 })
  } catch (error) {
    console.error('Failed to create BOM:', error)
    return NextResponse.json(
      {
        error: 'Failed to create BOM',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
