/**
 * Single Contract API Endpoint
 *
 * CRUD API for a single Contract:
 * - GET: Fetch a contract by ID
 * - PATCH: Update a contract
 * - DELETE: Soft delete a contract
 *
 * GET /api/contracts/[id]
 * PATCH /api/contracts/[id]
 * DELETE /api/contracts/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { contracts } from '@/lib/db/contracts'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/contracts/[id]
 *
 * Returns a single contract by ID (if not soft-deleted).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const contract = await contracts.findUnique(id, {
      Contact: true,
      ContractTemplate: true,
      ContractVersion: {
        orderBy: { version: 'desc' },
      },
      ContractSigner: true,
      Deal: true,
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found', message: `Contract with id ${id} not found` },
        { status: 404 }
      )
    }

    // Map Prisma PascalCase relations to API lowercase shape
    const { Contact, ContractTemplate, ContractVersion, ContractSigner, Deal, ...rest } =
      contract as Record<string, unknown> & { Contact?: unknown; ContractTemplate?: unknown; ContractVersion?: unknown; ContractSigner?: unknown; Deal?: unknown }
    const mapped = {
      ...rest,
      contact: Contact ?? null,
      template: ContractTemplate ?? null,
      versions: ContractVersion ?? [],
      signers: ContractSigner ?? [],
      deal: Deal ?? null,
    }

    return NextResponse.json({ data: mapped })
  } catch (error) {
    console.error('Failed to fetch contract:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/contracts/[id]
 *
 * Updates an existing contract.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    // Verify contract exists
    const existing = await contracts.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Contract not found', message: `Contract with id ${id} not found` },
        { status: 404 }
      )
    }

    // Prepare update data (coerce types from form values)
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.amount !== undefined) updateData.amount = body.amount === '' ? undefined : Number(body.amount)
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.status !== undefined) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes || null
    if (body.attributes !== undefined) updateData.attributes = body.attributes
    if (body.signedAt !== undefined) updateData.signedAt = body.signedAt ? new Date(body.signedAt) : null

    const updatedContract = await contracts.update(id, updateData)

    return NextResponse.json({ data: updatedContract })
  } catch (error) {
    console.error('Failed to update contract:', error)
    return NextResponse.json(
      { error: 'Failed to update contract', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/contracts/[id]
 *
 * Soft deletes a contract by setting deletedAt timestamp.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    const deletedContract = await contracts.softDelete(id)

    return NextResponse.json({ data: deletedContract })
  } catch (error) {
    console.error('Failed to delete contract:', error)
    return NextResponse.json(
      { error: 'Failed to delete contract', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
