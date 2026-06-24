/**
 * Single Category API Endpoint
 *
 * CRUD API for individual Category by ID:
 * - GET: Fetch a single category
 * - PATCH: Update a category
 * - DELETE: Soft-delete a category (isActive = false)
 *
 * GET /api/categories/[id]
 * PATCH /api/categories/[id]
 * DELETE /api/categories/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { categories } from '../../../../lib/db/categories'
import type { CategoryUpdateInput } from '../../../../lib/db/categories'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/categories/[id]
 *
 * Fetches a single active category by ID.
 * Returns 404 if category doesn't exist or is inactive.
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

    const category = await categories.findUnique(id)

    if (!category) {
      return NextResponse.json(
        { error: 'Not found', message: `Category with id ${id} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: category })
  } catch (error) {
    console.error('Failed to fetch category:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch category',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/categories/[id]
 *
 * Updates an existing category.
 * Accepts partial updates: name, type, parentId, order, isActive.
 * Validates parentId existence and cycle prevention.
 * Returns 404 if category doesn't exist.
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
        {
          error: 'Validation failed',
          message: 'type must be "income" or "expense"',
        },
        { status: 400 }
      )
    }

    // Prepare update data (only include provided fields)
    const updateData: CategoryUpdateInput = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) updateData.type = body.type
    if (body.parentId !== undefined) updateData.parentId = body.parentId
    if (body.order !== undefined) updateData.order = body.order
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updatedCategory = await categories.update(id, updateData)

    return NextResponse.json({ data: updatedCategory }, { status: 200 })
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
      message.includes('cannot be its own parent') ||
      message.includes('Parent category') ||
      message.includes('would create a cycle')
    ) {
      return NextResponse.json(
        { error: 'Validation failed', message },
        { status: 400 }
      )
    }

    console.error('Failed to update category:', error)
    return NextResponse.json(
      { error: 'Failed to update category', message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/categories/[id]
 *
 * Soft-deletes a category by setting isActive = false.
 * Refuses if category is referenced by Budget or Transaction records.
 * Returns 404 if category doesn't exist.
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

    const deletedCategory = await categories.delete(id)

    return NextResponse.json(
      { data: deletedCategory, message: 'Category deactivated successfully' },
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

    // Referential integrity → 409
    if (
      message.includes('referenced by') ||
      message.includes('Cannot delete')
    ) {
      return NextResponse.json(
        { error: 'Conflict', message },
        { status: 409 }
      )
    }

    console.error('Failed to delete category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category', message },
      { status: 500 }
    )
  }
}
