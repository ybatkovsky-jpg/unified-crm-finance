/**
 * Notifications Collection API — PLAT-02. (IDOR-fix: сессионный пользователь)
 *
 * GET  /api/notifications          — свои уведомления (session.id; query unreadOnly/type/limit)
 * GET  /api/notifications?userId=  — userId из query ИГНОРИРУЕТСЯ (всегда session.id)
 * POST /api/notifications          — создать (director — любому; прочие — только себе)
 */

import { NextRequest, NextResponse } from 'next/server'
import { notifications } from '@/lib/db/notifications'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // IDOR-fix: всегда используем session.id; userId из query игнорируется.
    const userId = session.id
    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type')
    const limit = searchParams.get('limit')

    const [data, unreadCount] = await Promise.all([
      notifications.findByUser(userId, {
        unreadOnly: unreadOnly || undefined,
        type: type ?? undefined,
        limit: limit ? parseInt(limit) : undefined,
      }),
      notifications.countUnread(userId),
    ])

    return NextResponse.json({ data, count: data.length, unreadCount })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'title and message are required' },
        { status: 400 }
      )
    }

    // IDOR-fix: director может создать любому; прочие — только себе.
    const isDirector = session.roleCodes.includes('director')
    const targetUserId = body.userId
    if (targetUserId && targetUserId !== session.id && !isDirector) {
      return NextResponse.json({ error: 'Forbidden', message: 'Нельзя создавать уведомления другим пользователям' }, { status: 403 })
    }
    const userId = targetUserId ?? session.id

    const newNotification = await notifications.create({
      userId,
      type: body.type ?? 'system',
      title: body.title,
      message: body.message,
      level: body.level ?? 'info',
      link: body.link ?? null,
      metadata: body.metadata ?? undefined,
    })

    return NextResponse.json({ data: newNotification }, { status: 201 })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
