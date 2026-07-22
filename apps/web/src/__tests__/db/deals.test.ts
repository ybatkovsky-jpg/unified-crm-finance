/**
 * Unit-тесты DealRepository.
 * Мокаем Prisma client. Проверяем базовые CRUD-операции.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────
vi.mock('../../lib/db/prisma', () => {
  const mockDeal = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  }
  const mockDealHistory = {
    create: vi.fn(),
  }
  const mockUser = { findFirst: vi.fn() }

  const mockPrisma = {
    deal: mockDeal,
    dealHistory: mockDealHistory,
    user: mockUser,
    $transaction: vi.fn((fn: any) => fn(mockPrisma)),
  }

  return { prisma: mockPrisma }
})

// Mock notifications (side-effects, не тестируем здесь)
vi.mock('../../lib/notifications/events', () => ({
  notifyDealStageChange: vi.fn(),
  notifyDealLost: vi.fn(),
}))

import { deals } from '../../lib/db/deals'
import { prisma } from '../../lib/db/prisma'

// ── Helpers ───────────────────────────────────────────────────────────
function makeDeal(overrides: Record<string, unknown> = {}) {
  return {
    id: 'deal-1',
    number: 'С-2026-00001',
    title: 'Test Deal',
    description: null,
    amount: 100000,
    currency: 'RUB',
    status: 'open',
    priority: 'medium',
    pipelineId: 'pipeline-1',
    stageId: 'stage-1',
    managerId: 'user-1',
    contactId: 'contact-1',
    sourceId: null,
    expectedCloseDate: null,
    closedAt: null,
    lossReason: null,
    lossComment: null,
    attributes: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────
describe('DealRepository.findMany', () => {
  it('возвращает сделки с фильтром deletedAt: null', async () => {
    const mockDeals = [makeDeal(), makeDeal({ id: 'deal-2', title: 'Deal 2' })]
    ;(prisma.deal.findMany as any).mockResolvedValue(mockDeals)

    const result = await deals.findMany()
    expect(result).toHaveLength(2)
    expect(prisma.deal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      })
    )
  })

  it('объединяет переданный where с deletedAt: null', async () => {
    ;(prisma.deal.findMany as any).mockResolvedValue([])

    // Используем реальное поле Deal (managerId), а не несуществующее `status`:
    // статус сделки выражается через stageId/stage.closedFlag, отдельного поля status нет.
    await deals.findMany({ where: { managerId: 'manager-1' } })
    expect(prisma.deal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { managerId: 'manager-1', deletedAt: null },
      })
    )
  })
})

describe('DealRepository.findUnique', () => {
  it('возвращает сделку по id (не soft-deleted)', async () => {
    const deal = makeDeal()
    ;(prisma.deal.findFirst as any).mockResolvedValue(deal)

    const result = await deals.findUnique('deal-1')
    expect(result).toEqual(deal)
    expect(prisma.deal.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'deal-1', deletedAt: null },
      })
    )
  })

  it('возвращает null если сделка не найдена', async () => {
    ;(prisma.deal.findFirst as any).mockResolvedValue(null)

    const result = await deals.findUnique('nonexistent')
    expect(result).toBeNull()
  })
})

describe('DealRepository.create', () => {
  it('создаёт сделку с автогенерацией номера', async () => {
    const created = makeDeal()
    ;(prisma.deal.create as any).mockResolvedValue(created)

    const result = await deals.create({
      title: 'New Deal',
      pipelineId: 'pipeline-1',
      stageId: 'stage-1',
    })

    expect(result).toEqual(created)
    expect(prisma.deal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'New Deal',
          number: expect.stringMatching(/^С-\d{4}-\d{5}$/),
        }),
      })
    )
  })
})

describe('DealRepository.update', () => {
  it('обновляет существующую сделку', async () => {
    const existing = makeDeal()
    const updated = makeDeal({ title: 'Updated Title' })
    ;(prisma.deal.findFirst as any).mockResolvedValue(existing)
    ;(prisma.deal.update as any).mockResolvedValue(updated)

    const result = await deals.update('deal-1', { title: 'Updated Title' })
    expect(result.title).toBe('Updated Title')
  })

  it('выбрасывает ошибку если сделка не найдена', async () => {
    ;(prisma.deal.findFirst as any).mockResolvedValue(null)

    await expect(deals.update('nonexistent', { title: 'X' })).rejects.toThrow(
      'Deal with id nonexistent not found'
    )
  })
})

describe('DealRepository.softDelete', () => {
  it('устанавливает deletedAt и не удаляет запись физически', async () => {
    const existing = makeDeal()
    const deleted = makeDeal({ deletedAt: new Date() })
    ;(prisma.deal.findFirst as any).mockResolvedValue(existing)
    ;(prisma.deal.update as any).mockResolvedValue(deleted)

    const result = await deals.softDelete('deal-1')
    expect(result.deletedAt).not.toBeNull()
    expect(prisma.deal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'deal-1' },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      })
    )
  })
})
