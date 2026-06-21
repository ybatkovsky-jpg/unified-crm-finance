/**
 * Contacts Collection API Endpoint
 *
 * CRUD API for Contact model:
 * - GET: List all contacts (excluding soft-deleted)
 * - POST: Create a new contact
 *
 * GET /api/contacts
 * POST /api/contacts
 */

import { NextRequest, NextResponse } from 'next/server'
import { contacts } from '../../../lib/db/contacts'
import type { ContactCreateInput } from '../../../lib/db/contacts'

/**
 * GET /api/contacts
 *
 * Returns all active contacts (excludes soft-deleted).
 * Supports optional query parameters for filtering.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (status) where.status = status

    const allContacts = await contacts.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: allContacts, count: allContacts.length })
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contacts
 *
 * Creates a new contact.
 * Validates required fields based on contact type (person vs company).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // Validate contact type
    if (!body.type || (body.type !== 'person' && body.type !== 'company')) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'type must be either "person" or "company"' },
        { status: 400 }
      )
    }

    // Type-specific validation
    if (body.type === 'person') {
      if (!body.firstName) {
        return NextResponse.json(
          { error: 'Validation failed', message: 'firstName is required for person contacts' },
          { status: 400 }
        )
      }
    } else if (body.type === 'company') {
      if (!body.companyName) {
        return NextResponse.json(
          { error: 'Validation failed', message: 'companyName is required for company contacts' },
          { status: 400 }
        )
      }
    }

    // Phone is required for all contacts
    if (!body.phone) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'phone is required' },
        { status: 400 }
      )
    }

    // Prepare creation data
    const createData: ContactCreateInput = {
      type: body.type,
      phone: body.phone,
      firstName: body.firstName || null,
      lastName: body.lastName || null,
      middleName: body.middleName || null,
      companyName: body.companyName || null,
      inn: body.inn || null,
      kpp: body.kpp || null,
      ogrn: body.ogrn || null,
      email: body.email || null,
      address: body.address || null,
      physicalAddress: body.physicalAddress || null,
      position: body.position || null,
      notes: body.notes || null,
      sourceId: body.sourceId || null,
      ownerId: body.ownerId || null,
      status: body.status || 'active',
      tags: body.tags || [],
      attributes: body.attributes || null,
    }

    const newContact = await contacts.create(createData)

    return NextResponse.json({ data: newContact }, { status: 201 })
  } catch (error) {
    console.error('Failed to create contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
