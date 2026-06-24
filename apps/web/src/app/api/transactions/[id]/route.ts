/**
 * Single Transaction API Endpoint
 *
 * CRUD API for individual Transaction by ID:
 * - GET: Fetch a single transaction
 * - PATCH: Update a transaction
 * - DELETE: Soft-delete a transaction
 *
 * GET /api/transactions/[id]
 * PATCH /api/transactions/[id]
 * DELETE /api/transactions/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { transactions } from '../../../../lib/db/transactions'
import type { TransactionUpdateInput } from '../../../../lib/db/transactions'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/transactions/[id]
 *
 * Fetches a single non-deleted transaction by ID with relations.
 * Returns 404 if transaction doesn't exist or is deleted.
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

    const transaction = await transactions.findById(id)

    if (!transaction) {
      return NextResponse.json(
        { error: 'Not found', message: `Transaction with id ${id} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: transaction })
  } catch (error) {
    console.error('Failed to fetch transaction:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch transaction',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/transactions/[id]
 *
 * Updates an existing transaction (partial update).
 * Returns 404 if not found, 400 on validation errors.
 */
export async function PATCH(
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

    // Validate type if provided
    if (
      body.type !== undefined &&
      body.type !== 'income' &&
      body.type !== 'expense'
    ) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'type must be "income" or "expense"' },
        { status: 400 }
      )
    }

    // Prepare update data (only include provided fields)
    const updateData: TransactionUpdateInput = {}
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.projectId !== undefined) updateData.projectId = body.projectId
    if (body.counterpartyId !== undefined) updateData.counterpartyId = body.counterpartyId
    if (body.invoiceId !== undefined) updateData.invoiceId = body.invoiceId
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.type !== undefined) updateData.type = body.type
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.source !== undefined) updateData.source = body.source

    const updatedTransaction = await transactions.update(id, updateData)

    return NextResponse.json({ data: updatedTransaction }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not found', message },
        { status: 404 }
      )
    }

    if (message.includes('inactive')) {
      return NextResponse.json(
        { error: 'Validation failed', message },
        { status: 400 }
      )
    }

    console.error('Failed to update transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction', message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/transactions/[id]
 *
 * Soft-deletes a transaction by setting deletedAt.
 * Returns 404 if not found.
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

    const deletedTransaction = await transactions.softDelete(id)

    return NextResponse.json(
      { data: deletedTransaction, message: 'Transaction deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not found', message },
        { status: 404 }
      )
    }

    console.error('Failed to delete transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction', message },
      { status: 500 }
    )
  }
}
