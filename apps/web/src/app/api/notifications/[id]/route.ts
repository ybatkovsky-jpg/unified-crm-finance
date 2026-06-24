/**
 * Single Notification API
 *
 * PATCH /api/notifications/[id] — mark as read
 * DELETE /api/notifications/[id] — delete notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { notifications } from '../../../../lib/db/notifications'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const body = await request.json()

    // Support mark-all-read via body flag
    if (body.markAllRead) {
      const count = await notifications.markAllAsRead(body.userId)
      return NextResponse.json({ data: { markedRead: count } })
    }

    const updated = await notifications.markAsRead(id)
    return NextResponse.json({ data: updated })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update notification', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await notifications.delete(id)
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete notification', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
