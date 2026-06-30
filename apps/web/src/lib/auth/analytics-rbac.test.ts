/**
 * Unit-тесты analytics-rbac (PLAT-03..05 RBAC fix).
 * Чистая логика — без моков, без БД.
 */

import { describe, it, expect } from 'vitest'
import { analyticsManagerScope, requireAnalyticsSession } from './analytics-rbac'
import type { SessionUser } from './session'

function makeSession(roleCodes: string[], id = 'user-1'): SessionUser {
  return {
    id,
    email: 'test@test.com',
    name: 'Test',
    roleCodes,
  } as SessionUser
}

describe('requireAnalyticsSession', () => {
  it('возвращает true для валидной сессии', () => {
    const session = makeSession(['director'])
    expect(requireAnalyticsSession(session)).toBe(true)
  })

  it('возвращает false для null', () => {
    expect(requireAnalyticsSession(null)).toBe(false)
  })
})

describe('analyticsManagerScope', () => {
  it('director — undefined (видит все)', () => {
    const scope = analyticsManagerScope(makeSession(['director']))
    expect(scope).toBeUndefined()
  })

  it('technologist — undefined (viewAllProjects роль)', () => {
    const scope = analyticsManagerScope(makeSession(['technologist']))
    expect(scope).toBeUndefined()
  })

  it('supply — undefined (viewAllProjects роль)', () => {
    const scope = analyticsManagerScope(makeSession(['supply']))
    expect(scope).toBeUndefined()
  })

  it('accountant — undefined (viewAllProjects роль)', () => {
    const scope = analyticsManagerScope(makeSession(['accountant']))
    expect(scope).toBeUndefined()
  })

  it('manager_designer — возвращает session.id (не viewAllProjects)', () => {
    const scope = analyticsManagerScope(makeSession(['manager_designer'], 'mgr-1'))
    expect(scope).toBe('mgr-1')
  })

  it('installer — возвращает session.id (не viewAllProjects)', () => {
    const scope = analyticsManagerScope(makeSession(['installer'], 'inst-1'))
    expect(scope).toBe('inst-1')
  })

  it('storekeeper — возвращает session.id (не viewAllProjects)', () => {
    const scope = analyticsManagerScope(makeSession(['storekeeper'], 'sk-1'))
    expect(scope).toBe('sk-1')
  })

  it('множественные роли — director+manager → undefined (director приоритетнее)', () => {
    const scope = analyticsManagerScope(makeSession(['manager_designer', 'director'], 'mgr-2'))
    expect(scope).toBeUndefined()
  })

  it('множественные роли — technologist+installer → undefined (technologist viewAll)', () => {
    const scope = analyticsManagerScope(makeSession(['installer', 'technologist'], 'u-1'))
    expect(scope).toBeUndefined()
  })

  it('множественные роли без viewAll → session.id', () => {
    const scope = analyticsManagerScope(makeSession(['manager_designer', 'storekeeper'], 'mgr-3'))
    expect(scope).toBe('mgr-3')
  })
})
