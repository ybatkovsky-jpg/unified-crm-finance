/**
 * BOM Items Collection API Endpoint
 *
 * CRUD API for BOMItem collection under a BOM:
 * - GET: List all items for a BOM
 * - POST: Add items array to a BOM (bulk create)
 *
 * GET /api/bom/[id]/items
 * POST /api/bom/[id]/items
 */

import { NextRequest, NextResponse } from 'next/server'
import { bom } from '../../../../../lib/db/bom'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/bom/[id]/items
 *
 * Returns all BOMItems for a given BOM, ordered by rowNumber.
 * Returns 404 if BOM doesn't exist.
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: bomId } = await params

    if (!bomId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'bomId is required' },
        { status: 400 }
      )
    }

    // Verify BOM exists
    const existing = await bom.findById(bomId)
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', message: `BOM with id ${bomId} not found` },
        { status: 404 }
      )
    }

    const items = await bom.findItemsByBomId(bomId)

    return NextResponse.json({ data: items, count: items.length })
  } catch (error) {
    console.error('Failed to fetch BOM items:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch BOM items',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/bom/[id]/items
 *
 * Adds items to a BOM (bulk create).
 * Validates: items is a non-empty array, each item has name and quantity.
 * Returns 404 if BOM doesn't exist. Returns 400 if BOM is locked.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: bomId } = await params
    const body = await request.json()

    if (!bomId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'bomId is required' },
        { status: 400 }
      )
    }

    const { items } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'items must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate each item has required fields
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.name) {
        return NextResponse.json(
          { error: 'Validation failed', message: `items[${i}].name is required` },
          { status: 400 }
        )
      }
      if (item.quantity === undefined || item.quantity === null) {
        return NextResponse.json(
          { error: 'Validation failed', message: `items[${i}].quantity is required` },
          { status: 400 }
        )
      }
    }

    // Verify BOM exists and is not locked
    const existing = await bom.findById(bomId)
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', message: `BOM with id ${bomId} not found` },
        { status: 404 }
      )
    }

    if (existing.status === 'locked') {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Cannot add items to a locked BOM' },
        { status: 409 }
      )
    }

    const count = await bom.bulkCreateItems(bomId, items)

    return NextResponse.json({ data: { count } }, { status: 201 })
  } catch (error) {
    console.error('Failed to add BOM items:', error)
    return NextResponse.json(
      {
        error: 'Failed to add BOM items',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
