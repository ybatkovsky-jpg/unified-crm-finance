/**
 * Unit-тесты хелпера requireSectionWrite (defense-in-depth RBAC на мутирующих эндпоинтах).
 * Чистая логика — без моков БД, проверяем только возвращаемые NextResponse/null.
 */

import { describe, it, expect } from 'vitest'
import { requireSectionWrite, isAdmin, isAdminOrDirector, canModify } from '../../lib/auth/permissions'
import type { SessionUser } from '../../lib/auth/session'

function makeSession(roleCodes: string[], id = 'user-1'): SessionUser {
  return {
    id,
    email: 'test@test.com',
    name: 'Test',
    roleCodes,
  } as SessionUser
}

describe('requireSectionWrite', () => {
  it('возвращает 401 для null-сессии (нет авторизации)', () => {
    const res = requireSectionWrite(null, 'crm')
    expect(res).not.toBeNull()
    expect(res!.status).toBe(401)
  })

  it('возвращает 403, если у роли нет доступа к разделу', () => {
    // storekeeper не имеет секции crm по ROLE_MATRIX
    const res = requireSectionWrite(makeSession(['storekeeper']), 'crm')
    expect(res).not.toBeNull()
    expect(res!.status).toBe(403)
  })

  it('возвращает 403 для installer и раздела crm', () => {
    const res = requireSectionWrite(makeSession(['installer']), 'crm')
    expect(res).not.toBeNull()
    expect(res!.status).toBe(403)
  })

  it('возвращает null, если роль имеет доступ к разделу', () => {
    // manager_designer имеет crm
    const res = requireSectionWrite(makeSession(['manager_designer']), 'crm')
    expect(res).toBeNull()
  })

  it('возвращает null для director (полный доступ)', () => {
    expect(requireSectionWrite(makeSession(['director']), 'crm')).toBeNull()
    expect(requireSectionWrite(makeSession(['director']), 'projects')).toBeNull()
    expect(requireSectionWrite(makeSession(['director']), 'finance')).toBeNull()
  })

  it('возвращает null для admin в любом разделе', () => {
    expect(requireSectionWrite(makeSession(['admin']), 'crm')).toBeNull()
    expect(requireSectionWrite(makeSession(['admin']), 'projects')).toBeNull()
    expect(requireSectionWrite(makeSession(['admin']), 'settings')).toBeNull()
  })

  it('учитывает несколько ролей (union) — manager + storekeeper → crm доступен через manager', () => {
    const res = requireSectionWrite(makeSession(['storekeeper', 'manager_designer']), 'crm')
    expect(res).toBeNull()
  })

  it('projects доступен technologist (есть в ROLE_MATRIX)', () => {
    expect(requireSectionWrite(makeSession(['technologist']), 'projects')).toBeNull()
  })

  it('projects НЕ доступен storekeeper', () => {
    const res = requireSectionWrite(makeSession(['storekeeper']), 'projects')
    expect(res).not.toBeNull()
    expect(res!.status).toBe(403)
  })
})

describe('isAdmin / isAdminOrDirector', () => {
  it('isAdmin — true только для admin', () => {
    expect(isAdmin(makeSession(['admin']))).toBe(true)
    expect(isAdmin(makeSession(['director']))).toBe(false)
    expect(isAdmin(makeSession(['manager_designer']))).toBe(false)
  })

  it('isAdminOrDirector — true для admin и director', () => {
    expect(isAdminOrDirector(makeSession(['admin']))).toBe(true)
    expect(isAdminOrDirector(makeSession(['director']))).toBe(true)
    expect(isAdminOrDirector(makeSession(['manager_designer']))).toBe(false)
  })

  it('isAdminOrDirector — true при мультироли с admin', () => {
    expect(isAdminOrDirector(makeSession(['storekeeper', 'admin']))).toBe(true)
  })
})

describe('canModify', () => {
  it('админ меняет всё (isOwner=false тоже OK)', () => {
    expect(canModify(makeSession(['admin']), false)).toBe(true)
  })

  it('не-админ меняет только своё (isOwner=true)', () => {
    expect(canModify(makeSession(['manager_designer']), true)).toBe(true)
    expect(canModify(makeSession(['manager_designer']), false)).toBe(false)
  })
})
