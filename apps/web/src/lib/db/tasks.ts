/**
 * TaskRepository — CRUD + фильтры + lineage переноса/пересоздания. PLAT-01.
 *
 * Паттерн как BudgetRepository: class-синглтон, валидация FK, randomUUID,
 * мягкое удаление. Дополнительно: фильтры (assignee/status/type/due),
 * статус-переходы, перенос (reschedule) и пересоздание (recreate) с lineage.
 */

import { prisma } from './prisma'
import type { Task, Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'

/** Контролируемые значения type/status (модель хранит String, валидация — в коде). */
export const TASK_TYPES = ['measurement_1', 'measurement_2', 'installation', 'general', 'client', 'org'] as const
export type TaskType = (typeof TASK_TYPES)[number]

export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'failed', 'cancelled'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

/** Метки типов выездов для UI. */
export const TASK_TYPE_LABELS: Record<string, string> = {
  measurement_1: 'Замер #1',
  measurement_2: 'Замер #2',
  installation: 'Монтаж',
  general: 'Общая',
  client: 'Клиентская',
  org: 'Орг-задача',
}

export type TaskCreateInput = Omit<
  Prisma.TaskUncheckedCreateInput,
  'id' | 'updatedAt'
> &
  Partial<Pick<Prisma.TaskUncheckedCreateInput, 'id' | 'updatedAt'>>

export interface TaskFilters {
  projectId?: string
  dealId?: string
  assigneeId?: string
  status?: string
  type?: string
  dueBefore?: string
  overdueOnly?: boolean
}

const ASSIGNEE_INCLUDE = {
  User_Task_assigneeIdToUser: { select: { id: true, name: true, email: true } },
} as const

export class TaskRepository {
  /** Одна задача по id (с исполнителем). */
  async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
      include: ASSIGNEE_INCLUDE,
    })
  }

  /**
   * Список задач с фильтрами. deletedAt: null по умолчанию.
   * overdueOnly — только просроченные (dueDate < now, status не done/cancelled).
   */
  async findWithFilters(filters: TaskFilters): Promise<Task[]> {
    const where: Prisma.TaskWhereInput = { deletedAt: null }

    if (filters.projectId) where.projectId = filters.projectId
    if (filters.dealId) where.dealId = filters.dealId
    if (filters.assigneeId) where.assigneeId = filters.assigneeId
    if (filters.status) where.status = filters.status
    if (filters.type) where.type = filters.type

    const now = new Date()
    if (filters.overdueOnly) {
      where.dueDate = { lt: now }
      where.status = { notIn: ['done', 'cancelled', 'failed'] }
    } else if (filters.dueBefore) {
      where.dueDate = { lte: new Date(filters.dueBefore) }
    }

    const args: Prisma.TaskFindManyArgs = {
      where,
      include: ASSIGNEE_INCLUDE,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    }
    return prisma.task.findMany(args)
  }

  /** Создание задачи. Валидирует type/status и существование assignee/project. */
  async create(data: TaskCreateInput): Promise<Task> {
    if (data.type && !TASK_TYPES.includes(data.type as TaskType)) {
      throw new Error(`Invalid task type: ${data.type}`)
    }
    if (data.status && !TASK_STATUSES.includes(data.status as TaskStatus)) {
      throw new Error(`Invalid task status: ${data.status}`)
    }

    if (data.assigneeId) {
      const u = await prisma.user.findUnique({ where: { id: data.assigneeId }, select: { id: true } })
      if (!u) throw new Error(`Assignee ${data.assigneeId} not found`)
    }
    if (data.projectId) {
      const p = await prisma.project.findUnique({ where: { id: data.projectId }, select: { id: true } })
      if (!p) throw new Error(`Project ${data.projectId} not found`)
    }

    return prisma.task.create({
      data: {
        ...data,
        id: data.id ?? randomUUID(),
        updatedAt: data.updatedAt ?? new Date(),
      },
      include: ASSIGNEE_INCLUDE,
    })
  }

  /** Редактирование (reassign, dueDate, status) — простой перенос. */
  async update(id: string, data: Partial<TaskCreateInput>): Promise<Task> {
    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) throw new Error(`Task ${id} not found`)

    if (data.type && !TASK_TYPES.includes(data.type as TaskType)) {
      throw new Error(`Invalid task type: ${data.type}`)
    }
    if (data.status && !TASK_STATUSES.includes(data.status as TaskStatus)) {
      throw new Error(`Invalid task status: ${data.status}`)
    }

    return prisma.task.update({
      where: { id },
      data: {
        ...data,
        completedAt: data.status === 'done' ? new Date() : data.status ? null : undefined,
        updatedAt: new Date(),
      },
      include: ASSIGNEE_INCLUDE,
    })
  }

  /**
   * Перенос: пометить старую задачу failed/cancelled (с причиной) и создать новую
   * с parentTaskId = старая, originalTaskId = корень цепочки (или старая).
   * Возвращает новую задачу.
   */
  async reschedule(
    id: string,
    newDueDate: Date,
    opts: { failedReason?: string; cancel?: boolean; assigneeId?: string } = {}
  ): Promise<Task> {
    const old = await prisma.task.findUnique({ where: { id } })
    if (!old) throw new Error(`Task ${id} not found`)

    const newTask = await prisma.$transaction(async (tx) => {
      // Пометить старую.
      await tx.task.update({
        where: { id },
        data: {
          status: opts.cancel ? 'cancelled' : 'failed',
          failedReason: opts.failedReason ?? null,
          updatedAt: new Date(),
        },
      })

      // Создать новую с переносом даты и сохранением lineage.
      return tx.task.create({
        data: {
          id: randomUUID(),
          title: old.title,
          description: old.description,
          type: old.type,
          status: 'todo',
          priority: old.priority,
          dueDate: newDueDate,
          contactId: old.contactId,
          projectId: old.projectId,
          dealId: old.dealId,
          assigneeId: opts.assigneeId ?? old.assigneeId,
          createdBy: old.createdBy,
          // Корень цепочки: originalTaskId старой, либо сама старая задача.
          originalTaskId: old.originalTaskId ?? old.id,
          parentTaskId: old.id,
          updatedAt: new Date(),
        },
        include: ASSIGNEE_INCLUDE,
      })
    })

    return newTask
  }

  /**
   * Пересоздание: копия задачи (как reschedule, но смысл — повтор выезда после неудачи).
   * Семантически alias reschedule с дефолтом cancel=false; оставлен отдельным методом
   * для ясности в API/UI. failedReason обязателен (почему пересоздаём).
   */
  async recreate(id: string, newDueDate: Date, failedReason: string, assigneeId?: string): Promise<Task> {
    if (!failedReason?.trim()) throw new Error('failedReason is required to recreate')
    return this.reschedule(id, newDueDate, { failedReason, cancel: false, assigneeId })
  }

  /**
   * PLAT-06: Орг-задачи (type='org') с учётом видимости.
   * - Директор: все орг-задачи.
   * - Руководитель функции (head): задачи функций, где он head.
   * - Ответственный: задачи, назначенные на него (assigneeId).
   * @param orgFunctionIds — функции, которые пользователь возглавляет (head). [] для не-head.
   */
  async findOrgTasks(opts: {
    userId: string
    isDirector?: boolean
    headFunctionIds?: string[]
    filters?: { status?: string; functionId?: string; assigneeId?: string }
  }): Promise<Task[]> {
    const { userId, isDirector = false, headFunctionIds = [], filters = {} } = opts
    const where: Prisma.TaskWhereInput = { deletedAt: null, type: 'org' }

    if (filters.status) where.status = filters.status
    if (filters.functionId) where.orgFunctionId = filters.functionId
    if (filters.assigneeId) where.assigneeId = filters.assigneeId

    if (!isDirector) {
      // Видимость: свои assigneeId ИЛИ функции, где head.
      const headClause: Prisma.TaskWhereInput = headFunctionIds.length
        ? { orgFunctionId: { in: headFunctionIds } }
        : { id: '__none__' } // невозможное условие если нет head-функций
      where.OR = [{ assigneeId: userId }, headClause]
    }

    const args: Prisma.TaskFindManyArgs = {
      where,
      include: {
        ...ASSIGNEE_INCLUDE,
        OrgFunction: { select: { id: true, name: true, Department: { select: { id: true, name: true } } } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    }
    return prisma.task.findMany(args)
  }

  /** Мягкое удаление. */
  async softDelete(id: string): Promise<Task> {
    const existing = await prisma.task.findUnique({ where: { id } })
    if (!existing) throw new Error(`Task ${id} not found`)
    return prisma.task.update({
      where: { id },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    })
  }
}

/** Singleton instance */
export const tasks = new TaskRepository()
export default tasks
