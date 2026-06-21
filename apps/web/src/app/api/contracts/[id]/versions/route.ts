/**
 * Contract Versions API Endpoint
 *
 * API for contract version management:
 * - GET: List all versions of a contract
 * - POST: Create a new version
 *
 * GET /api/contracts/[id]/versions
 * POST /api/contracts/[id]/versions
 */

import { NextRequest, NextResponse } from 'next/server'
import { contracts } from '@/lib/db/contracts'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/contracts/[id]/versions
 *
 * Returns all versions of a contract.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const versions = await contracts.getVersions(id)

    return NextResponse.json({ data: versions, count: versions.length })
  } catch (error) {
    console.error('Failed to fetch contract versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract versions', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contracts/[id]/versions
 *
 * Creates a new version of a contract.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: contractId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.contentMd) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'contentMd (markdown content) is required' },
        { status: 400 }
      )
    }

    if (!body.createdBy) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'createdBy (userId) is required' },
        { status: 400 }
      )
    }

    // Verify contract exists
    const contract = await contracts.findUnique(contractId)
    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found', message: `Contract with id ${contractId} not found` },
        { status: 404 }
      )
    }

    const version = await contracts.addVersion(
      contractId,
      body.contentMd,
      body.createdBy,
      body.generatedPdfFileId || undefined
    )

    return NextResponse.json({ data: version }, { status: 201 })
  } catch (error) {
    console.error('Failed to create contract version:', error)
    return NextResponse.json(
      { error: 'Failed to create contract version', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
