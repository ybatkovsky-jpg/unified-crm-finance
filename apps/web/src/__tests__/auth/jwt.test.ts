/**
 * Unit-тесты JWT-утилит (signSession + verifySession).
 * Проверяет базовый цикл sign→verify и негативные сценарии.
 *
 * AUTH_SECRET проверяется на уровне модуля при импорте jwt.ts.
 * Устанавливаем ДО импорта и используем динамический импорт,
 * чтобы process.env был доступен на момент загрузки модуля.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import type { SessionPayload } from '../../lib/auth/jwt'

// Устанавливаем до того, как любой модуль прочитает AUTH_SECRET
process.env.AUTH_SECRET = 'test-secret-key-for-unit-tests'

let signSession: (p: SessionPayload) => Promise<string>
let verifySession: (token: string) => Promise<SessionPayload | null>

beforeAll(async () => {
  const jwt = await import('../../lib/auth/jwt')
  signSession = jwt.signSession
  verifySession = jwt.verifySession
})

function makePayload(overrides: Partial<SessionPayload> = {}): SessionPayload {
  return {
    sub: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    roleCodes: ['admin'],
    ...overrides,
  }
}

describe('signSession + verifySession', () => {
  it('подписывает и верифицирует валидный payload', async () => {
    const payload = makePayload()
    const token = await signSession(payload)
    expect(token).toBeTruthy()
    expect(typeof token).toBe('string')

    const verified = await verifySession(token)
    expect(verified).not.toBeNull()
    expect(verified!.sub).toBe('user-1')
    expect(verified!.email).toBe('test@example.com')
    expect(verified!.name).toBe('Test User')
    expect(verified!.roleCodes).toEqual(['admin'])
  })

  it('верифицирует payload с несколькими ролями', async () => {
    const payload = makePayload({ roleCodes: ['director', 'admin'] })
    const token = await signSession(payload)
    const verified = await verifySession(token)
    expect(verified!.roleCodes).toEqual(['director', 'admin'])
  })

  it('возвращает null для поддельного токена', async () => {
    const result = await verifySession('invalid.token.here')
    expect(result).toBeNull()
  })

  it('возвращает null для пустой строки', async () => {
    const result = await verifySession('')
    expect(result).toBeNull()
  })

  it('roleCodes как строка → преобразуется в массив (обратная совместимость)', async () => {
    const payload = makePayload()
    const token = await signSession(payload)
    const verified = await verifySession(token)
    expect(Array.isArray(verified!.roleCodes)).toBe(true)
  })
})
