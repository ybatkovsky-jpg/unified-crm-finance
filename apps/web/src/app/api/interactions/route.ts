/**
 * Interactions Collection API Endpoint
 *
 * CRUD API for Interaction model:
 * - GET: List all interactions (optional contactId filter, ordered by createdAt desc)
 * - POST: Create a new interaction (validates contactId, type, content)
 *
 * GET /api/interactions
 * POST /api/interactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { interactions } from '../../../lib/db/interactions'
import { contacts } from '../../../lib/db/contacts'
import { getSession } from '../../../lib/auth/session'

const VALID_TYPES = ['call', 'meeting', 'email', 'note', 'task'] as const

/**
 * GET /api/interactions
 *
 * Returns all interactions, optionally filtered by contactId.
 * Ordered by createdAt descending.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const contactId = searchParams.get('contactId')

    const where: Record<string, unknown> = {}
    if (contactId) where.contactId = contactId

    const allInteractions = await interactions.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
    })

    return NextResponse.json({ data: allInteractions })
  } catch (error) {
    console.error('Failed to fetch interactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interactions', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/interactions
 *
 * Creates a new interaction.
 * Validates required fields: contactId, type.
 * Validates type must be one of: call|meeting|email|note|task.
 * content is required for non-note types.
 * Verifies contactId exists before creating.
 * authorId is taken from session — client-supplied value is ignored.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate contactId
    if (!body.contactId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'contactId is required' },
        { status: 400 }
      )
    }

    // Validate type
    if (!body.type || !VALID_TYPES.includes(body.type)) {
      return NextResponse.json(
        { error: 'Validation failed', message: `type must be one of: ${VALID_TYPES.join('|')}` },
        { status: 400 }
      )
    }

    // content required for non-note types
    if (body.type !== 'note' && !body.content) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'content is required for non-note interaction types' },
        { status: 400 }
      )
    }

    // Verify contactId exists
    const contactExists = await contacts.findUnique(body.contactId)
    if (!contactExists) {
      return NextResponse.json(
        { error: 'Not found', message: `Contact with id ${body.contactId} not found` },
        { status: 404 }
      )
    }

    // authorId всегда из сессии — предотвращает impersonation (IDOR)
    const newInteraction = await interactions.create({
      contactId: body.contactId,
      type: body.type,
      authorId: session.id,
      direction: body.direction ?? null,
      subject: body.subject ?? null,
      content: body.content ?? null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      eventId: body.eventId ?? null,
    })

    return NextResponse.json({ data: newInteraction }, { status: 201 })
  } catch (error) {
    console.error('Failed to create interaction:', error)
    return NextResponse.json(
      { error: 'Failed to create interaction', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
