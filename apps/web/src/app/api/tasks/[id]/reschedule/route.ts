/**
 * POST /api/tasks/[id]/reschedule — перенос задачи (PLAT-01).
 *
 * Помечает старую задачу failed/cancelled (с причиной) и создаёт новую с
 * переносом даты и сохранением lineage (parentTaskId/originalTaskId).
 *
 * Тело: { dueDate: ISO, failedReason?: string, cancel?: boolean, assigneeId?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { tasks } from '../../../../../lib/db/tasks'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.dueDate) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'dueDate is required' },
        { status: 400 }
      )
    }

    const newTask = await tasks.reschedule(id, new Date(body.dueDate), {
      failedReason: body.failedReason,
      cancel: body.cancel === true,
      assigneeId: body.assigneeId,
    })

    return NextResponse.json({ data: newTask }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('not found') ? 404 : 500
    if (status === 500) console.error('Failed to reschedule task:', error)
    return NextResponse.json({ error: 'Failed to reschedule task', message }, { status })
  }
}
