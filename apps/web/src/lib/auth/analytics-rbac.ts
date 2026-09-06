/**
 * RBAC-хелпер для аналитики (PLAT-03..05 RBAC fix).
 *
 * Проблема: api/analytics/* не фильтровали по viewAllProjects → менеджеры видели
 * чужие проекты/финансы как директор. Здесь — единая проверка: возвращает
 * managerId-фильтр для пользователя (null = видит все, если директор или роль с viewAllProjects).
 *
 * Использование в route:
 *   const session = await requireAnalyticsSession()
 *   const managerFilter = analyticsManagerScope(session)  // string | undefined
 *   ...where: managerFilter ? { managerId: managerFilter } : {}
 */

import type { SessionUser } from './session'
import { ROLE_MATRIX } from './roles'

/** Требовать сессию для аналитики (401 без неё). */
export function requireAnalyticsSession(session: SessionUser | null): session is SessionUser {
  return session !== null
}

/**
 * Скоуп по менеджеру: для не-viewAllProjects — session.id (видит только свои проекты/сделки);
 * для viewAllProjects (admin/director/technologist/supply/accountant) — undefined (видит все).
 *
 * Источник правды — ROLE_MATRIX.viewAllProjects (единая точка, без хардкода списка ролей).
 */
export function analyticsManagerScope(session: SessionUser): string | undefined {
  const canViewAll = session.roleCodes.some((c) => ROLE_MATRIX[c]?.viewAllProjects === true)
  if (canViewAll) return undefined
  return session.id
}
