/**
 * Single Notification API — PLAT-02. (IDOR-fix: сессионный пользователь)
 *
 * PATCH /api/notifications/[id] — mark as read (только своё уведомление)
 *        body { markAllRead: true } — отметить все свои прочитанными
 * DELETE /api/notifications/[id] — удалить (только своё)
 */

import { NextRequest, NextResponse } from 'next/server'
import { notifications } from '@/lib/db/notifications'
import { getSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const body = await request.json().catch(() => ({}))

    // Support mark-all-read: только свои уведомления (session.id).
    if (body.markAllRead) {
      const count = await notifications.markAllAsRead(session.id)
      return NextResponse.json({ data: { markedRead: count } })
    }

    // Проверка принадлежности: нельзя читать чужое уведомление.
    const target = await notifications.findById(id)
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (target.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Проверка принадлежности: нельзя удалить чужое уведомление.
    const target = await notifications.findById(id)
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (target.userId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await notifications.delete(id)
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete notification', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
