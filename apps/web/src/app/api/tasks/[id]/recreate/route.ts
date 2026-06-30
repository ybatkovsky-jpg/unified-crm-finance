/**
 * POST /api/tasks/[id]/recreate — пересоздание задачи после неудачи (PLAT-01).
 *
 * Создаёт копию задачи с новой датой; старая помечается failed.
 * failedReason обязателен (почему пересоздаём).
 *
 * Тело: { dueDate: ISO, failedReason: string, assigneeId?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { tasks } from '@/lib/db/tasks'
import { getSession } from '@/lib/auth/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // IDOR-fix: проверка владения.
    const existing = await tasks.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const isDirector = session.roleCodes.includes('director')
    if (!isDirector && existing.assigneeId !== session.id && existing.createdBy !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.dueDate) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'dueDate is required' },
        { status: 400 }
      )
    }
    if (!body.failedReason) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'failedReason is required to recreate' },
        { status: 400 }
      )
    }

    const newTask = await tasks.recreate(id, new Date(body.dueDate), body.failedReason, body.assigneeId)

    return NextResponse.json({ data: newTask }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('not found') ? 404 : 500
    if (status === 500) console.error('Failed to recreate task:', error)
    return NextResponse.json({ error: 'Failed to recreate task', message }, { status })
  }
}
