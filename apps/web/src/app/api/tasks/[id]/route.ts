/**
 * PATCH /api/tasks/[id] — редактирование задачи (reassign, dueDate, status). PLAT-01.
 * Перенос даты — здесь (простой PATCH dueDate). Полный перенос с lineage — /reschedule.
 * DELETE — мягкое удаление.
 */

import { NextRequest, NextResponse } from 'next/server'
import { tasks } from '../../../../lib/db/tasks'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) updateData.type = body.type
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.status !== undefined) updateData.status = body.status
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    }

    const task = await tasks.update(id, updateData)
    return NextResponse.json({ data: task })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('not found') || message.includes('Invalid') ? 400 : 500
    if (status === 500) console.error('Failed to update task:', error)
    return NextResponse.json({ error: status === 400 ? 'Validation failed' : 'Failed to update task', message }, { status })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    await tasks.softDelete(id)
    return NextResponse.json({ data: { id }, message: 'Task deleted' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: 'Failed to delete task', message }, { status })
  }
}
