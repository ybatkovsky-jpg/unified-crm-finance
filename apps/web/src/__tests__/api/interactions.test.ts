/**
 * Unit-тесты POST /api/interactions — проверка защиты от impersonation.
 * authorId должен браться из сессии, а не из тела запроса.
 * Фикс CRITICAL: IDOR/immpersonation через client-supplied authorId.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────
vi.mock('../../lib/auth/session', () => ({
  getSession: vi.fn(),
}))

vi.mock('../../lib/db/interactions', () => {
  const mockInteractionsRepo = {
    findMany: vi.fn(),
    create: vi.fn(),
  }
  return { interactions: mockInteractionsRepo }
})

vi.mock('../../lib/db/contacts', () => {
  const mockContactsRepo = {
    findUnique: vi.fn(),
  }
  return { contacts: mockContactsRepo }
})

import { getSession } from '../../lib/auth/session'
import { interactions } from '../../lib/db/interactions'
import { contacts } from '../../lib/db/contacts'

// Re-import after mocks
const { POST, GET } = await import('../../app/api/interactions/route')

// ── Helpers ───────────────────────────────────────────────────────────
function mockRequest(body: unknown, searchParams?: URLSearchParams) {
  const url = new URL('http://localhost/api/interactions')
  if (searchParams) url.search = searchParams.toString()

  const req = new Request(url, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }) as any

  // Next.js App Router добавляет nextUrl к объекту запроса
  req.nextUrl = url

  return req
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────
describe('POST /api/interactions — защита от impersonation', () => {
  it('возвращает 401 если нет сессии', async () => {
    ;(getSession as any).mockResolvedValue(null)

    const req = mockRequest({
      contactId: 'contact-1',
      type: 'call',
      content: 'Test call',
      authorId: 'attacker-id', // злоумышленник пытается подставить чужой ID
    })

    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('использует session.id, а не body.authorId', async () => {
    ;(getSession as any).mockResolvedValue({
      id: 'session-user-id',
      email: 'real@user.com',
      name: 'Real User',
      roleCodes: ['admin'],
    })
    ;(contacts.findUnique as any).mockResolvedValue({ id: 'contact-1' })
    ;(interactions.create as any).mockResolvedValue({
      id: 'interaction-1',
      contactId: 'contact-1',
      type: 'call',
      authorId: 'session-user-id', // должно быть из сессии
    })

    const req = mockRequest({
      contactId: 'contact-1',
      type: 'call',
      content: 'Test call',
      authorId: 'attacker-id', // атакующий ID — должен быть проигнорирован
    })

    const res = await POST(req as any)
    expect(res.status).toBe(201)

    // Проверяем, что interactions.create вызван с session.id (не attacker-id)
    expect(interactions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        authorId: 'session-user-id',
      })
    )
  })

  it('отклоняет запрос без contactId даже при валидной сессии', async () => {
    ;(getSession as any).mockResolvedValue({
      id: 'session-user-id',
      email: 'real@user.com',
      name: 'Real User',
      roleCodes: ['admin'],
    })

    const req = mockRequest({
      type: 'call',
      content: 'Test call',
    })

    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toContain('contactId')
  })
})

describe('GET /api/interactions — проверка сессии', () => {
  it('возвращает 401 если нет сессии', async () => {
    ;(getSession as any).mockResolvedValue(null)

    const req = mockRequest(null)

    const res = await GET(req as any)
    expect(res.status).toBe(401)
  })

  it('возвращает взаимодействия для авторизованного пользователя', async () => {
    ;(getSession as any).mockResolvedValue({
      id: 'session-user-id',
      email: 'real@user.com',
      name: 'Real User',
      roleCodes: ['admin'],
    })
    ;(interactions.findMany as any).mockResolvedValue([
      { id: 'i-1', authorId: 'session-user-id', type: 'call' },
      { id: 'i-2', authorId: 'other-user', type: 'email' },
    ])

    const req = mockRequest(null)

    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
  })
})
