/**
 * Categories Collection API Endpoint
 *
 * CRUD API for Category model:
 * - GET: List categories with optional type, isActive, includeInactive filters
 * - POST: Create a new category with validation
 *
 * GET /api/categories
 * POST /api/categories
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db/prisma'
import { categories } from '../../../lib/db/categories'

/**
 * GET /api/categories
 *
 * Returns a flat active category list sorted by parentId (nulls first), then order.
 * Supports optional query parameters:
 * - type: filter by "income" or "expense"
 * - isActive: filter by active status (true/false)
 * - includeInactive: when "true", includes both active and inactive categories
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')
    const includeInactive = searchParams.get('includeInactive')

    const where: Record<string, unknown> = {}

    if (type) where.type = type

    // Build isActive filter: default to active-only unless includeInactive is set
    if (includeInactive !== 'true') {
      if (isActive !== null) {
        where.isActive = isActive === 'true'
      } else {
        where.isActive = true
      }
    } else if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const allCategories = await prisma.category.findMany({
      where,
      orderBy: [
        { parentId: { sort: 'asc', nulls: 'first' } },
        { order: 'asc' },
      ],
    })

    const count = await prisma.category.count({ where })

    return NextResponse.json({ data: allCategories, count })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/categories
 *
 * Creates a new category.
 * Validates required fields: name and type (income/expense).
 * Optionally validates parentId existence and cycle prevention.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'name is required' },
        { status: 400 }
      )
    }

    if (!body.type || (body.type !== 'income' && body.type !== 'expense')) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'type must be "income" or "expense"',
        },
        { status: 400 }
      )
    }

    const createData = {
      name: body.name,
      type: body.type,
      parentId: body.parentId ?? null,
      order: body.order ?? 0,
      isActive: body.isActive ?? true,
    }

    const newCategory = await categories.create(createData)

    return NextResponse.json({ data: newCategory }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Repository validation errors (invalid parentId, cycles) → 400
    if (
      message.includes('Parent category') ||
      message.includes('would create a cycle')
    ) {
      return NextResponse.json(
        { error: 'Validation failed', message },
        { status: 400 }
      )
    }

    console.error('Failed to create category:', error)
    return NextResponse.json(
      { error: 'Failed to create category', message },
      { status: 500 }
    )
  }
}
