/**
 * Single Budget API Endpoint
 *
 * CRUD API for individual Budget by ID:
 * - GET: Fetch a single budget
 * - PATCH: Update a budget
 * - DELETE: Delete a budget
 *
 * GET /api/budgets/[id]
 * PATCH /api/budgets/[id]
 * DELETE /api/budgets/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { budgets } from '../../../../lib/db/budgets'
import type { BudgetUpdateInput } from '../../../../lib/db/budgets'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/budgets/[id]
 *
 * Fetches a single budget by ID.
 * Returns 404 if budget doesn't exist.
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

    const budget = await budgets.findById(id)

    if (!budget) {
      return NextResponse.json(
        { error: 'Not found', message: `Budget with id ${id} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: budget })
  } catch (error) {
    console.error('Failed to fetch budget:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch budget',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/budgets/[id]
 *
 * Updates an existing budget.
 * Accepts partial updates: amount, period, note, categoryId, projectId.
 * Returns 404 if budget doesn't exist, 400 on validation errors.
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

    // Prepare update data (only include provided fields)
    const updateData: BudgetUpdateInput = {}
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.period !== undefined) updateData.period = body.period
    if (body.note !== undefined) updateData.note = body.note
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.projectId !== undefined) updateData.projectId = body.projectId

    const updatedBudget = await budgets.update(id, updateData)

    return NextResponse.json({ data: updatedBudget }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Not found → 404
    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not found', message },
        { status: 404 }
      )
    }

    // Validation errors → 400
    if (
      message.includes('already exists') ||
      message.includes('inactive')
    ) {
      return NextResponse.json(
        { error: 'Validation failed', message },
        { status: 400 }
      )
    }

    console.error('Failed to update budget:', error)
    return NextResponse.json(
      { error: 'Failed to update budget', message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/budgets/[id]
 *
 * Permanently deletes a budget.
 * Returns 404 if budget doesn't exist.
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

    const deletedBudget = await budgets.delete(id)

    return NextResponse.json(
      { data: deletedBudget, message: 'Budget deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Not found → 404
    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not found', message },
        { status: 404 }
      )
    }

    console.error('Failed to delete budget:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget', message },
      { status: 500 }
    )
  }
}
