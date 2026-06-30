/**
 * Tasks API — PLAT-01.
 *
 * - GET  /api/tasks?projectId=&assigneeId=&status=&type=&dueBefore=&overdue=1
 *        → список задач с фильтрами (мои задачи / просроченные / по проекту)
 * - POST /api/tasks → создать задачу (валидация type/status/assignee в repo)
 */

import { NextRequest, NextResponse } from 'next/server'
import { tasks, TASK_TYPES, TASK_STATUSES } from '@/lib/db/tasks'
import { notifyTaskOverdue } from '@/lib/notifications/events'
import { taskTemplates } from '@/lib/db/task-templates'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sp = request.nextUrl.searchParams
    const overdue = sp.get('overdue') === '1'

    // PLAT-06: ленивая материализация инстансов повторяющихся орг-шаблонов
    // (fire-and-forget — как просрочка, не блокирует ответ).
    void taskTemplates.materializeInstances().catch((err) =>
      console.error('[tasks GET] org materialization failed:', err)
    )

    const data = await tasks.findWithFilters({
      projectId: sp.get('projectId') ?? undefined,
      assigneeId: sp.get('assigneeId') ?? undefined,
      status: sp.get('status') ?? undefined,
      type: sp.get('type') ?? undefined,
      dueBefore: sp.get('dueBefore') ?? undefined,
      overdueOnly: overdue,
    })

    // PLAT-02: ленивая просрочка — при чтении задач создаём уведомления
    // исполнителям просроченных (с dedupeKey, чтобы не дублировать).
    // Неблокирующе, не ломает ответ.
    const now = Date.now()
    void Promise.all(
      data
        .filter((t) => t.assigneeId && t.dueDate && new Date(t.dueDate).getTime() < now
          && !['done', 'cancelled', 'failed'].includes(t.status))
        .map((t) => notifyTaskOverdue(t.assigneeId!, t.title, t.id, new Date(t.dueDate!)))
    ).catch((err) => console.error('[tasks GET] overdue notifications failed:', err))

    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'title is required' },
        { status: 400 }
      )
    }

    const createData = {
      title: body.title,
      description: body.description ?? null,
      type: body.type ?? 'general',
      status: 'todo',
      priority: body.priority ?? 'medium',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      contactId: body.contactId ?? null,
      projectId: body.projectId ?? null,
      dealId: body.dealId ?? null,
      assigneeId: body.assigneeId ?? null,
      createdBy: body.createdBy ?? 'system',
    }

    const task = await tasks.create(createData)
    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (
      message.includes('Invalid task') ||
      message.includes('not found')
    ) {
      return NextResponse.json({ error: 'Validation failed', message }, { status: 400 })
    }
    console.error('Failed to create task:', error)
    return NextResponse.json({ error: 'Failed to create task', message }, { status: 500 })
  }
}

// Экспорт допустимых значений для клиентского использования (если нужно).
export { TASK_TYPES, TASK_STATUSES }
