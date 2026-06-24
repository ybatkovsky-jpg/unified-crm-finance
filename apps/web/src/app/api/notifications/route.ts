/**
 * Notifications Collection API
 *
 * GET /api/notifications — list notifications for current user
 * POST /api/notifications — create a notification
 * PATCH /api/notifications/mark-all-read — mark all as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { notifications } from '../../../lib/db/notifications'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const type = searchParams.get('type')
    const limit = searchParams.get('limit')

    if (!userId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'userId is required' },
        { status: 400 }
      )
    }

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
    const body = await request.json()

    if (!body.userId || !body.title || !body.message) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'userId, title, and message are required' },
        { status: 400 }
      )
    }

    const newNotification = await notifications.create({
      userId: body.userId,
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
