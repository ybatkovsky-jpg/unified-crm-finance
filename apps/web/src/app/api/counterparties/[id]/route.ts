/**
 * Single Counterparty API Endpoint
 *
 * CRUD API for individual Counterparty by ID:
 * - GET: Fetch a single counterparty with related records
 * - PUT: Update a counterparty
 * - DELETE: Soft-delete a counterparty
 *
 * GET /api/counterparties/[id]
 * PUT /api/counterparties/[id]
 * DELETE /api/counterparties/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { counterparties } from '../../../../lib/db/counterparties'
import type { CounterpartyUpdateInput } from '../../../../lib/db/counterparties'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/counterparties/[id]
 *
 * Fetches a single counterparty by ID with related records.
 * Returns 404 if counterparty doesn't exist or is soft-deleted.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    const counterparty = await counterparties.findUnique(id, {
      PurchaseRequest: {
        select: { id: true, number: true, status: true, createdAt: true },
      },
      Invoice: {
        select: { id: true, number: true, status: true, totalAmount: true, createdAt: true },
      },
      Delivery: {
        select: { id: true, trackingNumber: true, status: true, estimatedDate: true, createdAt: true },
      },
    })

    if (!counterparty) {
      return NextResponse.json(
        { error: 'Not found', message: `Counterparty with id ${id} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: counterparty })
  } catch (error) {
    console.error('Failed to fetch counterparty:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch counterparty',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/counterparties/[id]
 *
 * Updates an existing counterparty.
 * Returns 404 if counterparty doesn't exist.
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    // Verify counterparty exists first
    const existing = await counterparties.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', message: `Counterparty with id ${id} not found` },
        { status: 404 }
      )
    }

    // Prepare update data (only include provided fields)
    const updateData: CounterpartyUpdateInput = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.types !== undefined) updateData.types = body.types
    if (body.inn !== undefined) updateData.inn = body.inn
    if (body.kpp !== undefined) updateData.kpp = body.kpp
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson
    if (body.address !== undefined) updateData.address = body.address
    if (body.bankName !== undefined) updateData.bankName = body.bankName
    if (body.bankAccount !== undefined) updateData.bankAccount = body.bankAccount
    if (body.korAccount !== undefined) updateData.korAccount = body.korAccount
    if (body.bik !== undefined) updateData.bik = body.bik
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.rating !== undefined) updateData.rating = body.rating
    if (body.attributes !== undefined) updateData.attributes = body.attributes

    const updatedCounterparty = await counterparties.update(id, updateData)

    return NextResponse.json({ data: updatedCounterparty }, { status: 200 })
  } catch (error) {
    console.error('Failed to update counterparty:', error)
    return NextResponse.json(
      {
        error: 'Failed to update counterparty',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/counterparties/[id]
 *
 * Soft-deletes a counterparty by setting deletedAt timestamp.
 * Returns 404 if counterparty doesn't exist.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    const deletedCounterparty = await counterparties.softDelete(id)

    return NextResponse.json(
      { data: deletedCounterparty, message: 'Counterparty soft-deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Check if this is a "not found" error from repository
    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not found', message },
        { status: 404 }
      )
    }

    console.error('Failed to delete counterparty:', error)
    return NextResponse.json(
      { error: 'Failed to delete counterparty', message },
      { status: 500 }
    )
  }
}
