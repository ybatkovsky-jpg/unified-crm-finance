/**
 * Tasks API — PLAT-01.
 *
 * - GET  /api/tasks?projectId=&assigneeId=&status=&type=&dueBefore=&overdue=1
 *        → список задач с фильтрами (мои задачи / просроченные / по проекту)
 * - POST /api/tasks → создать задачу (валидация type/status/assignee в repo)
 */

import { NextRequest, NextResponse } from 'next/server'
import { tasks, TASK_TYPES, TASK_STATUSES } from '@/lib/db/tasks'
import { notifyTaskOverdue, notifyProjectDeadline } from '@/lib/notifications/events'
import { taskTemplates } from '@/lib/db/task-templates'
import { getSession } from '@/lib/auth/session'
import { isAdminOrDirector } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = request.nextUrl.searchParams
    const overdue = sp.get('overdue') === '1'
    const dealId = sp.get('dealId') ?? undefined

    // IDOR-fix: если запрашивают задачи по сделке, проверить доступ к сделке.
    if (dealId) {
      const isDirector = isAdminOrDirector(session)
      if (!isDirector) {
        const deal = await prisma.deal.findUnique({
          where: { id: dealId, deletedAt: null },
          select: { managerId: true },
        })
        if (!deal) return NextResponse.json({ error: 'Сделка не найдена' }, { status: 404 })
        if (deal.managerId !== session.id) {
          return NextResponse.json({ error: 'Forbidden', message: 'Нет доступа к задачам этой сделки' }, { status: 403 })
        }
      }
    }

    // PLAT-06: ленивая материализация инстансов повторяющихся орг-шаблонов
    // (fire-and-forget — как просрочка, не блокирует ответ).
    void taskTemplates.materializeInstances().catch((err) =>
      console.error('[tasks GET] org materialization failed:', err)
    )

    // IDOR-fix: director видит все задачи; прочие — только свои (assigneeId=session.id),
    // если не запрашивают чужого assigneeId явно (что для не-director → свои).
    const isDirector = isAdminOrDirector(session)
    const requestedAssignee = sp.get('assigneeId')
    const effectiveAssignee = isDirector ? (requestedAssignee ?? undefined) : (requestedAssignee ?? session.id)

    const data = await tasks.findWithFilters({
      projectId: sp.get('projectId') ?? undefined,
      dealId: sp.get('dealId') ?? undefined,
      assigneeId: effectiveAssignee,
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

    // PLAT-02: ленивая проверка дедлайнов проектов (60 дней) — создаём уведомления
    // менеджерам проектов, приближающихся к дедлайну.
    const deadline60d = new Date(now + 60 * 24 * 60 * 60 * 1000)
    void prisma.project.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['completed', 'closed'] },
        endDate: { not: null, lte: deadline60d, gte: new Date() },
      },
      select: { id: true, name: true, managerId: true, endDate: true },
    }).then((projects) =>
      Promise.all(
        projects
          .filter((p) => p.managerId && p.endDate)
          .map((p) => {
            const daysLeft = Math.ceil((new Date(p.endDate!).getTime() - now) / (24 * 60 * 60 * 1000))
            return notifyProjectDeadline(p.managerId!, p.name, p.id, daysLeft)
          })
      )
    ).catch((err) => console.error('[tasks GET] project deadline notifications failed:', err))

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
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
      // IDOR-fix: createdBy всегда из сессии (раньше 'system' — несуществующий FK).
      createdBy: session.id,
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
