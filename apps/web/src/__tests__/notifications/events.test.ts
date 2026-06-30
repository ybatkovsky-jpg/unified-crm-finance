/**
 * Unit-тесты notification events (PLAT-02).
 * Мокаем prisma + notifications repository.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks (vi.fn inside factory — no external vars, избегаем hoisting) ──
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    notification: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock('@/lib/db/notifications', () => ({
  notifications: {
    create: vi.fn(),
  },
}))

import { notify, notifyTaskOverdue, notifyNewLead, notifyDealStageChange } from '../../lib/notifications/events'
import { prisma } from '@/lib/db/prisma'
import { notifications } from '@/lib/db/notifications'

describe('notify (базовая функция)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('создаёт уведомление без dedupeKey', async () => {
    vi.mocked(notifications.create).mockResolvedValueOnce({ id: 'n1' } as any)

    await notify({
      userId: 'user-1',
      type: 'test',
      title: 'Test',
      message: 'Hello',
    })

    expect(notifications.create).toHaveBeenCalledTimes(1)
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: 'test',
        title: 'Test',
        message: 'Hello',
        level: 'info',
        dedupeKey: null,
      })
    )
  })

  it('с dedupeKey — проверяет существующее и создаёт если нет дубля', async () => {
    vi.mocked(prisma.notification.findFirst).mockResolvedValueOnce(null)
    vi.mocked(notifications.create).mockResolvedValueOnce({ id: 'n2' } as any)

    await notify({
      userId: 'user-1',
      type: 'test',
      title: 'Test',
      message: 'Hello',
      dedupeKey: 'key-1',
    })

    expect(prisma.notification.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        isRead: false,
        dedupeKey: 'key-1',
      },
    })
    expect(notifications.create).toHaveBeenCalledTimes(1)
    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        dedupeKey: 'key-1',
        metadata: { dedupeKey: 'key-1' },
      })
    )
  })

  it('с dedupeKey — НЕ создаёт если уже есть непрочитанное (dedupe fix)', async () => {
    vi.mocked(prisma.notification.findFirst).mockResolvedValueOnce({
      id: 'existing',
      dedupeKey: 'key-1',
      isRead: false,
    } as any)

    await notify({
      userId: 'user-1',
      type: 'test',
      title: 'Test',
      message: 'Hello',
      dedupeKey: 'key-1',
    })

    expect(notifications.create).not.toHaveBeenCalled()
  })

  it('не бросает исключение при ошибке создания (побочный эффект)', async () => {
    vi.mocked(notifications.create).mockRejectedValueOnce(new Error('DB down'))

    await expect(
      notify({ userId: 'u1', type: 't', title: 'T', message: 'M' })
    ).resolves.toBeUndefined()
  })
})

describe('notifyTaskOverdue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('создаёт с dedupeKey = task_overdue:${taskId}', async () => {
    vi.mocked(prisma.notification.findFirst).mockResolvedValueOnce(null)
    vi.mocked(notifications.create).mockResolvedValueOnce({ id: 'n3' } as any)

    await notifyTaskOverdue('assignee-1', 'Срочная задача', 'task-42', new Date('2026-06-01'))

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'assignee-1',
        type: 'task_overdue',
        level: 'error',
        dedupeKey: 'task_overdue:task-42',
        link: '/tasks',
      })
    )
  })
})

describe('notifyNewLead', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('уведомляет менеджера о новом лиде', async () => {
    vi.mocked(notifications.create).mockResolvedValueOnce({ id: 'n4' } as any)

    await notifyNewLead('mgr-1', 'Иван Петров', 'lead-1')

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'mgr-1',
        type: 'lead',
        title: 'Новый лид',
        link: '/crm/contacts',
      })
    )
  })
})

describe('notifyDealStageChange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('уведомляет о смене стадии сделки', async () => {
    vi.mocked(notifications.create).mockResolvedValueOnce({ id: 'n5' } as any)

    await notifyDealStageChange('mgr-2', 'Кухня 12м', 'КП', 'Договор', 'deal-1')

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'mgr-2',
        type: 'deal_stage',
        message: '«Кухня 12м»: КП → Договор',
        link: '/deals/deal-1',
      })
    )
  })
})
