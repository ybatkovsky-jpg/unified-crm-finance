/**
 * Deal Comments API
 *
 * - GET  /api/deals/[id]/comments  → список комментариев сделки
 * - POST /api/deals/[id]/comments  → создать комментарий { content }
 */

import { NextRequest, NextResponse } from 'next/server'
import { comments } from '@/lib/db/comments'
import { deals } from '@/lib/db/deals'
import { getSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Проверяем что сделка существует.
    const deal = await deals.findUnique(id)
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const list = await comments.findByEntity('deal', id)
    return NextResponse.json({ data: list })
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Проверяем что сделка существует.
    const deal = await deals.findUnique(id)
    if (!deal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const content = typeof body.content === 'string' ? body.content.trim() : ''
    if (!content) {
      return NextResponse.json({ error: 'Validation failed', message: 'content is required' }, { status: 400 })
    }

    const created = await comments.create({
      content,
      authorId: session.id,
      entityType: 'deal',
      entityId: id,
    })
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
