/**
 * TaskTemplateRepository — шаблоны орг-задач + материализация инстансов. PLAT-06.
 *
 * Шаблон = разовая задача (rrule=null, dtStart=срок) или повторяющаяся (RFC-5545 rrule).
 * Из повторяющихся шаблонов лениво материализуются инстансы Task при наступлении срока:
 * при чтении доски/«Моих задач» вызывается materializeInstances(now) — для каждого активного
 * шаблона вычисляются инстансы с датой <= now, для которых нет Task(templateId, plannedDate),
 * и создаются. Идемпотентно: повторный вызов ничего не добавляет.
 *
 * Assignee-стратегии шаблона:
 *   function_responsible → первый FunctionAssignment(role=responsible) функции,
 *   function_head        → FunctionAssignment(role=head) функции,
 *   fixed                → fixedAssigneeId,
 *   unassigned           → без исполнителя.
 */

import { prisma } from './prisma'
import type { TaskTemplate, Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { NotFoundError, ValidationError } from './errors'
import { occurrencesBetween, isValidRrule } from '@/lib/org/rrule'

export const TEMPLATE_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export type TemplatePriority = (typeof TEMPLATE_PRIORITIES)[number]

export const ASSIGNEE_STRATEGIES = [
  'function_responsible',
  'function_head',
  'fixed',
  'unassigned',
] as const
export type AssigneeStrategy = (typeof ASSIGNEE_STRATEGIES)[number]

export const ASSIGNEE_STRATEGY_LABELS: Record<AssigneeStrategy, string> = {
  function_responsible: 'Ответственный функции',
  function_head: 'Руководитель функции',
  fixed: 'Конкретный сотрудник',
  unassigned: 'Без исполнителя',
}

const TEMPLATE_INCLUDE = {
  OrgFunction: { select: { id: true, name: true, Department: { select: { id: true, name: true } } } },
  User_TaskTemplate_createdByToUser: { select: { id: true, name: true } },
  User_TaskTemplate_fixedAssigneeToUser: { select: { id: true, name: true } },
} as const

export type TaskTemplateCreateInput = {
  functionId?: string | null
  title: string
  description?: string | null
  priority?: TemplatePriority
  rrule?: string | null
  dtStart: Date
  dtEnd?: Date | null
  assigneeStrategy?: AssigneeStrategy
  fixedAssigneeId?: string | null
  createdBy: string
}

export class TaskTemplateRepository {
  /** Все активные шаблоны (с функцией и исполнителем). */
  async findAll(): Promise<TaskTemplate[]> {
    const args: Prisma.TaskTemplateFindManyArgs = {
      where: { deletedAt: null },
      orderBy: [{ title: 'asc' }],
      include: TEMPLATE_INCLUDE,
    }
    return prisma.taskTemplate.findMany(args) as any
  }

  async findById(id: string): Promise<any> {
    const args: Prisma.TaskTemplateFindUniqueArgs = {
      where: { id },
      include: TEMPLATE_INCLUDE,
    }
    return prisma.taskTemplate.findUnique(args)
  }

  /** Создать шаблон. Валидирует rrule и assignee-стратегию. */
  async create(data: TaskTemplateCreateInput): Promise<TaskTemplate> {
    if (!data.title?.trim()) throw new ValidationError('Template title is required')
    if (!data.dtStart) throw new ValidationError('dtStart is required')

    // Функция опциональна, но если задана — должна существовать.
    if (data.functionId) {
      const fn = await prisma.orgFunction.findUnique({ where: { id: data.functionId } })
      if (!fn || fn.deletedAt) throw new NotFoundError(`Function ${data.functionId} not found`)
    }

    // rrule валидация (если задан — это повторяющаяся задача).
    if (data.rrule && !isValidRrule(data.rrule)) {
      throw new ValidationError(`Invalid RRULE: ${data.rrule}`)
    }

    // Assignee-стратегия.
    const strategy = data.assigneeStrategy ?? 'function_responsible'
    if (!ASSIGNEE_STRATEGIES.includes(strategy)) {
      throw new ValidationError(`Invalid assignee strategy: ${strategy}`)
    }
    if (strategy === 'fixed' && !data.fixedAssigneeId) {
      throw new ValidationError('fixedAssigneeId is required when strategy=fixed')
    }
    if (data.fixedAssigneeId) {
      const u = await prisma.user.findUnique({ where: { id: data.fixedAssigneeId } })
      if (!u || u.deletedAt) throw new NotFoundError(`User ${data.fixedAssigneeId} not found`)
    }

    return prisma.taskTemplate.create({
      data: {
        id: randomUUID(),
        functionId: data.functionId ?? null,
        title: data.title.trim(),
        description: data.description ?? null,
        priority: data.priority ?? 'medium',
        rrule: data.rrule ?? null,
        dtStart: data.dtStart,
        dtEnd: data.dtEnd ?? null,
        isActive: true,
        assigneeStrategy: strategy,
        fixedAssigneeId: data.fixedAssigneeId ?? null,
        createdBy: data.createdBy,
        updatedAt: new Date(),
      },
      include: TEMPLATE_INCLUDE,
    }) as any
  }

  async update(id: string, data: Partial<TaskTemplateCreateInput> & { isActive?: boolean }): Promise<TaskTemplate> {
    const t = await prisma.taskTemplate.findUnique({ where: { id } })
    if (!t || t.deletedAt) throw new NotFoundError(`Template ${id} not found`)

    if (data.rrule !== undefined && data.rrule && !isValidRrule(data.rrule)) {
      throw new ValidationError(`Invalid RRULE: ${data.rrule}`)
    }
    if (data.functionId !== undefined && data.functionId) {
      const fn = await prisma.orgFunction.findUnique({ where: { id: data.functionId } })
      if (!fn || fn.deletedAt) throw new NotFoundError(`Function ${data.functionId} not found`)
    }

    return prisma.taskTemplate.update({
      where: { id },
      data: {
        ...(data.functionId !== undefined && { functionId: data.functionId }),
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.rrule !== undefined && { rrule: data.rrule }),
        ...(data.dtStart !== undefined && { dtStart: data.dtStart }),
        ...(data.dtEnd !== undefined && { dtEnd: data.dtEnd }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.assigneeStrategy !== undefined && { assigneeStrategy: data.assigneeStrategy }),
        ...(data.fixedAssigneeId !== undefined && { fixedAssigneeId: data.fixedAssigneeId }),
        updatedAt: new Date(),
      },
      include: TEMPLATE_INCLUDE,
    }) as any
  }

  async softDelete(id: string): Promise<void> {
    const t = await prisma.taskTemplate.findUnique({ where: { id } })
    if (!t || t.deletedAt) throw new NotFoundError(`Template ${id} not found`)
    await prisma.taskTemplate.update({ where: { id }, data: { deletedAt: new Date(), updatedAt: new Date() } })
  }

  // ── Материализация инстансов ────────────────────────────────────────

  /**
   * Резолв исполнителя для инстанса по стратегии шаблона.
   * Возвращает userId или null (если функция без назначений / unassigned).
   */
  async resolveAssignee(template: {
    assigneeStrategy: string
    fixedAssigneeId: string | null
    functionId: string | null
  }): Promise<string | null> {
    switch (template.assigneeStrategy) {
      case 'fixed':
        return template.fixedAssigneeId
      case 'unassigned':
        return null
      case 'function_head':
      case 'function_responsible': {
        if (!template.functionId) return null
        const wantRole = template.assigneeStrategy === 'function_head' ? 'head' : 'responsible'
        const a = await prisma.functionAssignment.findFirst({
          where: { functionId: template.functionId, role: wantRole },
          orderBy: { createdAt: 'asc' },
        })
        return a?.userId ?? null
      }
      default:
        return null
    }
  }

  /**
   * Материализовать инстансы Task для всех активных повторяющихся шаблонов.
   * Для каждого шаблона: вычислить инстансы с plannedDate <= now, которых ещё нет
   * (проверка по (templateId, plannedDate)), и создать Task с type='org'.
   * Идемпотентно. Возвращает кол-во созданных инстансов.
   *
   * Разовые шаблоны (rrule=null) НЕ материализуются здесь — они создают задачу
   * один раз в момент создания шаблона (createOneTimeInstance).
   */
  async materializeInstances(now: Date = new Date()): Promise<number> {
    const templates = await prisma.taskTemplate.findMany({
      where: { deletedAt: null, isActive: true, rrule: { not: null } },
    })

    let created = 0
    for (const t of templates) {
      const rule = t.rrule!
      const dtStart = t.dtStart
      // Окно материализации: от dtStart до now (включительно).
      // Если now < dtStart — инстансов ещё нет.
      if (now.getTime() < dtStart.getTime()) continue

      // upper bound = min(now, dtEnd)
      const upper = t.dtEnd && t.dtEnd.getTime() < now.getTime() ? t.dtEnd : now

      let occurrences: Date[]
      try {
        occurrences = occurrencesBetween(rule, dtStart, dtStart, upper)
      } catch {
        continue // невалидное правило — пропустить (не должно быть после валидации)
      }

      if (occurrences.length === 0) continue

      // Существующие инстансы этого шаблона (по plannedDate) — чтобы не дублировать.
      const existing = await prisma.task.findMany({
        where: { templateId: t.id, plannedDate: { in: occurrences } },
        select: { plannedDate: true },
      })
      const existingKeys = new Set(existing.map((e) => e.plannedDate?.getTime()))

      const missing = occurrences.filter((d) => !existingKeys.has(d.getTime()))
      if (missing.length === 0) continue

      const assigneeId = await this.resolveAssignee(t)

      await prisma.$transaction(
        missing.map((d) =>
          prisma.task.create({
            data: {
              id: randomUUID(),
              title: t.title,
              description: t.description,
              type: 'org',
              status: 'todo',
              priority: t.priority,
              dueDate: d,
              templateId: t.id,
              plannedDate: d,
              orgFunctionId: t.functionId,
              assigneeId,
              createdBy: t.createdBy,
              updatedAt: new Date(),
            },
          })
        )
      )
      created += missing.length
    }
    return created
  }

  /**
   * Создать инстанс для разового шаблона (rrule=null) — однократно.
   * Вызывается сразу после создания разового шаблона.
   */
  async createOneTimeInstance(templateId: string): Promise<void> {
    const t = await prisma.taskTemplate.findUnique({ where: { id: templateId } })
    if (!t || t.rrule) return // только для разовых

    const assigneeId = await this.resolveAssignee(t)
    await prisma.task.create({
      data: {
        id: randomUUID(),
        title: t.title,
        description: t.description,
        type: 'org',
        status: 'todo',
        priority: t.priority,
        dueDate: t.dtStart,
        templateId: t.id,
        plannedDate: t.dtStart,
        orgFunctionId: t.functionId,
        assigneeId,
        createdBy: t.createdBy,
        updatedAt: new Date(),
      },
    })
  }
}

/** Singleton instance */
export const taskTemplates = new TaskTemplateRepository()
export default taskTemplates
