/**
 * Single Contact API Endpoint
 *
 * CRUD API for individual Contact by ID:
 * - GET: Fetch a single contact
 * - PUT: Update a contact
 * - DELETE: Soft-delete a contact
 *
 * GET /api/contacts/[id]
 * PUT /api/contacts/[id]
 * DELETE /api/contacts/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { contacts } from '../../../../lib/db/contacts'
import type { ContactUpdateInput } from '../../../../lib/db/contacts'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/contacts/[id]
 *
 * Fetches a single contact by ID.
 * Returns 404 if contact doesn't exist or is soft-deleted.
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    const contact = await contacts.findUnique(id)

    if (!contact) {
      return NextResponse.json(
        { error: 'Not found', message: `Contact with id ${id} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: contact })
  } catch (error) {
    console.error('Failed to fetch contact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/contacts/[id]
 *
 * Updates an existing contact.
 * Validates fields based on contact type.
 * Returns 404 if contact doesn't exist.
 */
export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    // Verify contact exists first
    const existing = await contacts.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', message: `Contact with id ${id} not found` },
        { status: 404 }
      )
    }

    // Type-specific validation for updates
    if (body.type === 'person' && body.firstName === '') {
      return NextResponse.json(
        { error: 'Validation failed', message: 'firstName cannot be empty for person contacts' },
        { status: 400 }
      )
    }

    if (body.type === 'company' && body.companyName === '') {
      return NextResponse.json(
        { error: 'Validation failed', message: 'companyName cannot be empty for company contacts' },
        { status: 400 }
      )
    }

    // Prepare update data (only include provided fields)
    const updateData: ContactUpdateInput = {}
    if (body.type !== undefined) updateData.type = body.type
    if (body.firstName !== undefined) updateData.firstName = body.firstName
    if (body.lastName !== undefined) updateData.lastName = body.lastName
    if (body.middleName !== undefined) updateData.middleName = body.middleName
    if (body.companyName !== undefined) updateData.companyName = body.companyName
    if (body.inn !== undefined) updateData.inn = body.inn
    if (body.kpp !== undefined) updateData.kpp = body.kpp
    if (body.ogrn !== undefined) updateData.ogrn = body.ogrn
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.address !== undefined) updateData.address = body.address
    if (body.physicalAddress !== undefined) updateData.physicalAddress = body.physicalAddress
    if (body.position !== undefined) updateData.position = body.position
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.sourceId !== undefined) updateData.sourceId = body.sourceId
    if (body.ownerId !== undefined) updateData.ownerId = body.ownerId
    if (body.status !== undefined) updateData.status = body.status
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.attributes !== undefined) updateData.attributes = body.attributes

    const updatedContact = await contacts.update(id, updateData)

    return NextResponse.json({ data: updatedContact }, { status: 200 })
  } catch (error) {
    console.error('Failed to update contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/contacts/[id]
 *
 * Soft-deletes a contact by setting deletedAt timestamp.
 * Returns 404 if contact doesn't exist.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    const deletedContact = await contacts.softDelete(id)

    return NextResponse.json(
      { data: deletedContact, message: 'Contact soft-deleted successfully' },
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

    console.error('Failed to delete contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact', message },
      { status: 500 }
    )
  }
}
