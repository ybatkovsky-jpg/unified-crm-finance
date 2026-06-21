/**
 * Contact Interactions Timeline API Endpoint
 *
 * Nested API for fetching a contact's interaction timeline:
 * - GET: Returns interactions for a contact, ordered by createdAt desc, including author name
 *
 * GET /api/contacts/[id]/interactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { interactions } from '../../../../../lib/db/interactions'
import { contacts } from '../../../../../lib/db/contacts'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/contacts/[id]/interactions
 *
 * Returns the interaction timeline for a specific contact.
 * Ordered by createdAt descending, includes author User.name for display.
 * Returns 404 if the contact doesn't exist.
 */
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'contact id is required' },
        { status: 400 }
      )
    }

    // Verify contact exists first
    const contact = await contacts.findUnique(id)
    if (!contact) {
      return NextResponse.json(
        { error: 'Not found', message: `Contact with id ${id} not found` },
        { status: 404 }
      )
    }

    // Use findMany with include to get author name in single query
    const contactInteractions = await interactions.findMany({
      where: { contactId: id },
      include: { User: { select: { name: true } } },
    })

    // Map to include author name at top level for consumers
    const timeline = contactInteractions.map((item) => {
      const { User, ...rest } = item as typeof item & { User?: { name: string } | null }
      return {
        ...rest,
        author: User ? { name: User.name } : null,
      }
    })

    return NextResponse.json({ data: timeline })
  } catch (error) {
    console.error('Failed to fetch contact interactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact interactions', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
