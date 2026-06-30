/**
 * Unit-тесты TaskRepository (PLAT-01).
 * Мокаем Prisma client. $transaction пробрасывает тот же prisma-объект
 * как tx, чтобы моки на prisma.task.* работали внутри транзакции.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks (vi.fn inside factory — no external vars, избегаем hoisting) ──
vi.mock('./prisma', () => {
  // Создаём единый mock-объект prisma, который $transaction вернёт как tx.
  const mockTask = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  }
  const mockUser = { findUnique: vi.fn() }
  const mockProject = { findUnique: vi.fn() }

  const mockPrisma = {
    task: mockTask,
    user: mockUser,
    project: mockProject,
    // $transaction передаёт тот же prisma как tx — моки общие.
    $transaction: vi.fn((fn: any) => fn(mockPrisma)),
  }

  return { prisma: mockPrisma }
})

import { tasks } from './tasks'
import { prisma } from './prisma'

// ── Helpers ────────────────────────────────────────────────────────
function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    title: 'Test Task',
    description: null,
    type: 'general',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date('2026-07-15'),
    contactId: null,
    projectId: null,
    dealId: null,
    assigneeId: 'user-1',
    createdBy: 'user-2',
    originalTaskId: null,
    parentTaskId: null,
    orgFunctionId: null,
    templateId: null,
    plannedDate: null,
    completedAt: null,
    failedReason: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('TaskRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── findWithFilters ──────────────────────────────────────────────
  describe('findWithFilters', () => {
    it('возвращает задачи с deletedAt: null по умолчанию', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([])
      await tasks.findWithFilters({})
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
        })
      )
    })

    it('фильтрует по projectId', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([])
      await tasks.findWithFilters({ projectId: 'proj-1' })
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, projectId: 'proj-1' },
        })
      )
    })

    it('фильтрует по dealId', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([])
      await tasks.findWithFilters({ dealId: 'deal-1' })
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, dealId: 'deal-1' },
        })
      )
    })

    it('фильтрует по assigneeId', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([])
      await tasks.findWithFilters({ assigneeId: 'user-1' })
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, assigneeId: 'user-1' },
        })
      )
    })

    it('фильтрует по status', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([])
      await tasks.findWithFilters({ status: 'in_progress' })
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, status: 'in_progress' },
        })
      )
    })

    it('overdueOnly: dueDate < now и status не done/cancelled/failed', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([])
      await tasks.findWithFilters({ overdueOnly: true })
      const callArgs = vi.mocked(prisma.task.findMany).mock.calls[0][0] as any
      expect(callArgs.where.dueDate).toEqual({ lt: expect.any(Date) })
      expect(callArgs.where.status).toEqual({ notIn: ['done', 'cancelled', 'failed'] })
    })

    it('dueBefore: фильтрует по дате', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([])
      await tasks.findWithFilters({ dueBefore: '2026-07-01' })
      const callArgs = vi.mocked(prisma.task.findMany).mock.calls[0][0] as any
      expect(callArgs.where.dueDate).toEqual({ lte: expect.any(Date) })
    })
  })

  // ── create ───────────────────────────────────────────────────────
  describe('create', () => {
    it('создаёт задачу с валидными данными', async () => {
      const task = makeTask()
      vi.mocked(prisma.task.create).mockResolvedValueOnce(task as any)

      const result = await tasks.create({
        title: 'Test',
        type: 'general',
        status: 'todo',
      })

      expect(result).toEqual(task)
      expect(prisma.task.create).toHaveBeenCalledTimes(1)
    })

    it('бросает ошибку при невалидном type', async () => {
      await expect(
        tasks.create({ title: 'Test', type: 'invalid_type' as any, status: 'todo' })
      ).rejects.toThrow('Invalid task type')
    })

    it('бросает ошибку при невалидном status', async () => {
      await expect(
        tasks.create({ title: 'Test', type: 'general', status: 'invalid_status' as any })
      ).rejects.toThrow('Invalid task status')
    })

    it('проверяет существование assignee', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      await expect(
        tasks.create({ title: 'Test', type: 'general', status: 'todo', assigneeId: 'bad-user' })
      ).rejects.toThrow('Assignee bad-user not found')
    })

    it('проверяет существование project', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
      vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(null)
      await expect(
        tasks.create({ title: 'Test', type: 'general', status: 'todo', projectId: 'bad-project' })
      ).rejects.toThrow('Project bad-project not found')
    })
  })

  // ── update ───────────────────────────────────────────────────────
  describe('update', () => {
    it('обновляет задачу', async () => {
      const task = makeTask()
      vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(task as any)
      vi.mocked(prisma.task.update).mockResolvedValueOnce({ ...task, status: 'done' } as any)

      const result = await tasks.update('task-1', { status: 'done' })
      expect(result.status).toBe('done')
    })

    it('бросает если задача не найдена', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(null)
      await expect(tasks.update('bad-id', { status: 'done' })).rejects.toThrow('Task bad-id not found')
    })

    it('бросает при невалидном type', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(makeTask() as any)
      await expect(
        tasks.update('task-1', { type: 'bad' as any })
      ).rejects.toThrow('Invalid task type')
    })

    it('ставит completedAt при status=done', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(makeTask() as any)
      vi.mocked(prisma.task.update).mockResolvedValueOnce(makeTask({ status: 'done' }) as any)

      await tasks.update('task-1', { status: 'done' })
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'done',
            completedAt: expect.any(Date),
          }),
        })
      )
    })
  })

  // ── softDelete ───────────────────────────────────────────────────
  describe('softDelete', () => {
    it('устанавливает deletedAt', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(makeTask() as any)
      vi.mocked(prisma.task.update).mockResolvedValueOnce(makeTask({ deletedAt: new Date() }) as any)

      await tasks.softDelete('task-1')
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        })
      )
    })

    it('бросает если задача не найдена', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(null)
      await expect(tasks.softDelete('bad-id')).rejects.toThrow('Task bad-id not found')
    })
  })

  // ── reschedule ───────────────────────────────────────────────────
  describe('reschedule', () => {
    it('помечает старую failed и создаёт новую с lineage', async () => {
      const old = makeTask({ id: 'old-1', originalTaskId: null })
      vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(old as any)
      // $transaction: tx.task.update + tx.task.create (тот же prisma.task.*)
      vi.mocked(prisma.task.update).mockResolvedValueOnce({ ...old, status: 'failed' } as any)
      const newTask = makeTask({ id: 'new-1', originalTaskId: 'old-1', parentTaskId: 'old-1' })
      vi.mocked(prisma.task.create).mockResolvedValueOnce(newTask as any)

      const result = await tasks.reschedule('old-1', new Date('2026-08-01'))

      expect(result.id).toBe('new-1')
      expect(result.originalTaskId).toBe('old-1')
      expect(result.parentTaskId).toBe('old-1')
    })

    it('сохраняет originalTaskId из старой задачи (цепочка)', async () => {
      const old = makeTask({ id: 'old-2', originalTaskId: 'root-1' })
      vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(old as any)
      vi.mocked(prisma.task.update).mockResolvedValueOnce({ ...old, status: 'failed' } as any)
      const newTask = makeTask({ id: 'new-2', originalTaskId: 'root-1', parentTaskId: 'old-2' })
      vi.mocked(prisma.task.create).mockResolvedValueOnce(newTask as any)

      const result = await tasks.reschedule('old-2', new Date('2026-08-01'))

      expect(result.originalTaskId).toBe('root-1')
    })

    it('бросает если старая задача не найдена', async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(null)
      await expect(
        tasks.reschedule('bad-id', new Date())
      ).rejects.toThrow('Task bad-id not found')
    })
  })

  // ── recreate ─────────────────────────────────────────────────────
  describe('recreate', () => {
    it('требует failedReason', async () => {
      await expect(
        tasks.recreate('task-1', new Date(), '')
      ).rejects.toThrow('failedReason is required')
    })

    it('создаёт копию задачи (reschedule с cancel=false)', async () => {
      const old = makeTask({ id: 'old-3', originalTaskId: null })
      vi.mocked(prisma.task.findUnique).mockResolvedValueOnce(old as any)
      vi.mocked(prisma.task.update).mockResolvedValueOnce({ ...old, status: 'failed', failedReason: 'ошибка' } as any)
      const newTask = makeTask({ id: 'new-3', originalTaskId: 'old-3', parentTaskId: 'old-3', status: 'todo' })
      vi.mocked(prisma.task.create).mockResolvedValueOnce(newTask as any)

      const result = await tasks.recreate('old-3', new Date('2026-08-01'), 'ошибка выезда')

      expect(result.status).toBe('todo')
    })
  })

  // ── findOrgTasks ─────────────────────────────────────────────────
  describe('findOrgTasks (PLAT-06)', () => {
    it('директор видит все орг-задачи', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([])
      await tasks.findOrgTasks({ userId: 'dir-1', isDirector: true })
      const callArgs = vi.mocked(prisma.task.findMany).mock.calls[0][0] as any
      expect(callArgs.where.OR).toBeUndefined()
      expect(callArgs.where.type).toBe('org')
    })

    it('head видит задачи своих функций + свои', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([])
      await tasks.findOrgTasks({
        userId: 'head-1',
        headFunctionIds: ['func-1', 'func-2'],
      })
      const callArgs = vi.mocked(prisma.task.findMany).mock.calls[0][0] as any
      expect(callArgs.where.OR).toEqual([
        { assigneeId: 'head-1' },
        { orgFunctionId: { in: ['func-1', 'func-2'] } },
      ])
    })

    it('рядовой сотрудник видит только свои задачи', async () => {
      vi.mocked(prisma.task.findMany).mockResolvedValueOnce([])
      await tasks.findOrgTasks({
        userId: 'user-1',
        headFunctionIds: [],
      })
      const callArgs = vi.mocked(prisma.task.findMany).mock.calls[0][0] as any
      expect(callArgs.where.OR).toEqual([
        { assigneeId: 'user-1' },
        { id: '__none__' },
      ])
    })
  })
})
