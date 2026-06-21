/**
 * Contract Signers API Endpoint
 *
 * API for contract signer management:
 * - GET: List all signers of a contract
 * - POST: Add a new signer
 *
 * GET /api/contracts/[id]/signers
 * POST /api/contracts/[id]/signers
 */

import { NextRequest, NextResponse } from 'next/server'
import { contracts } from '../../../../../lib/db/contracts'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/contracts/[id]/signers
 *
 * Returns all signers of a contract.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const signers = await contracts.getSigners(id)

    return NextResponse.json({ data: signers, count: signers.length })
  } catch (error) {
    console.error('Failed to fetch contract signers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract signers', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contracts/[id]/signers
 *
 * Adds a new signer to a contract.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: contractId } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'name is required' },
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

    const signer = await contracts.addSigner(
      contractId,
      body.name,
      body.position || undefined,
      body.signatureFileId || undefined
    )

    return NextResponse.json({ data: signer }, { status: 201 })
  } catch (error) {
    console.error('Failed to add contract signer:', error)
    return NextResponse.json(
      { error: 'Failed to add contract signer', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
