/**
 * Counterparties Collection API Endpoint
 *
 * CRUD API for Counterparty model:
 * - GET: List counterparties with optional type and search filtering
 * - POST: Create a new counterparty
 *
 * GET /api/counterparties
 * POST /api/counterparties
 */

import { NextRequest, NextResponse } from 'next/server'
import { counterparties } from '../../../lib/db/counterparties'

/**
 * GET /api/counterparties
 *
 * Returns all active counterparties (excludes soft-deleted).
 * Supports optional query parameters for filtering by type and search.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { inn: { contains: search, mode: 'insensitive' } },
      ]
    }

    const allCounterparties = await counterparties.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
    })

    const count = await counterparties.count(
      Object.keys(where).length > 0 ? where : undefined
    )

    return NextResponse.json({ data: allCounterparties, count })
  } catch (error) {
    console.error('Failed to fetch counterparties:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch counterparties',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/counterparties
 *
 * Creates a new counterparty.
 * Validates required fields: name and type.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // Validate name is required
    if (!body.name) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'name is required' },
        { status: 400 }
      )
    }

    // Validate type is required and must be supplier or customer
    if (!body.type || (body.type !== 'supplier' && body.type !== 'customer')) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'type must be either "supplier" or "customer"',
        },
        { status: 400 }
      )
    }

    // Prepare creation data (id/updatedAt filled by repository)
    const createData = {
      name: body.name,
      type: body.type,
      types: body.types ?? [],
      inn: body.inn ?? null,
      kpp: body.kpp ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      contactPerson: body.contactPerson ?? null,
      address: body.address ?? null,
      bankName: body.bankName ?? null,
      bankAccount: body.bankAccount ?? null,
      korAccount: body.korAccount ?? null,
      bik: body.bik ?? null,
      notes: body.notes ?? null,
      rating: body.rating ?? null,
      attributes: body.attributes ?? null,
    }

    const newCounterparty = await counterparties.create(createData)

    return NextResponse.json({ data: newCounterparty }, { status: 201 })
  } catch (error) {
    console.error('Failed to create counterparty:', error)
    return NextResponse.json(
      {
        error: 'Failed to create counterparty',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
