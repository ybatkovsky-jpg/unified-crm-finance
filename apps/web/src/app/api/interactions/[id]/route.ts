/**
 * Single Interaction API Endpoint
 *
 * CRUD API for individual Interaction by ID:
 * - GET: Fetch a single interaction
 * - PUT: Update an interaction
 * - DELETE: Hard delete an interaction
 *
 * GET /api/interactions/[id]
 * PUT /api/interactions/[id]
 * DELETE /api/interactions/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { interactions } from '../../../../lib/db/interactions'
import type { InteractionUpdateInput } from '../../../../lib/db/interactions'
import { getSession } from '@/lib/auth/session'
import { canModify } from '@/lib/auth/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/interactions/[id]
 *
 * Fetches a single interaction by ID.
 * Returns 404 if interaction doesn't exist.
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

    const interaction = await interactions.findUnique(id)

    if (!interaction) {
      return NextResponse.json(
        { error: 'Not found', message: `Interaction with id ${id} not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: interaction })
  } catch (error) {
    console.error('Failed to fetch interaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interaction', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/interactions/[id]
 *
 * Updates an existing interaction.
 * Returns 404 if interaction doesn't exist.
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

    // Verify interaction exists first
    const existing = await interactions.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', message: `Interaction with id ${id} not found` },
        { status: 404 }
      )
    }

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!canModify(session, existing.authorId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate type if provided
    const VALID_TYPES = ['call', 'meeting', 'email', 'note', 'task'] as const
    if (body.type !== undefined && !VALID_TYPES.includes(body.type)) {
      return NextResponse.json(
        { error: 'Validation failed', message: `type must be one of: ${VALID_TYPES.join('|')}` },
        { status: 400 }
      )
    }

    // Prepare update data (only include provided fields)
    const updateData: InteractionUpdateInput = {}
    if (body.type !== undefined) updateData.type = body.type
    if (body.direction !== undefined) updateData.direction = body.direction
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.content !== undefined) updateData.content = body.content
    if (body.contactId !== undefined) updateData.contactId = body.contactId
    if (body.authorId !== undefined) updateData.authorId = body.authorId
    if (body.scheduledAt !== undefined) updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    if (body.completedAt !== undefined) updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null
    if (body.eventId !== undefined) updateData.eventId = body.eventId

    const updatedInteraction = await interactions.update(id, updateData)

    return NextResponse.json({ data: updatedInteraction }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not found', message },
        { status: 404 }
      )
    }

    console.error('Failed to update interaction:', error)
    return NextResponse.json(
      { error: 'Failed to update interaction', message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/interactions/[id]
 *
 * Hard deletes an interaction.
 * Returns 404 if interaction doesn't exist.
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

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await interactions.findUnique(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Not found', message: `Interaction with id ${id} not found` },
        { status: 404 }
      )
    }
    if (!canModify(session, existing.authorId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deletedInteraction = await interactions.delete(id)

    return NextResponse.json(
      { data: deletedInteraction, message: 'Interaction deleted successfully' },
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

    console.error('Failed to delete interaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete interaction', message },
      { status: 500 }
    )
  }
}
