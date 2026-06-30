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

/** Требовать сессию для аналитики (401 без неё). */
export function requireAnalyticsSession(session: SessionUser | null): session is SessionUser {
  return session !== null
}

/**
 * Скоуп по менеджеру: для не-viewAllProjects — session.id (видит только свои проекты/сделки);
 * для viewAllProjects/director — undefined (видит все).
 */
export function analyticsManagerScope(session: SessionUser): string | undefined {
  const isDirector = session.roleCodes.includes('director')
  // viewAllProjects: true если хоть одна роль это разрешает (manager_designer/installer — false).
  const canViewAll = session.roleCodes.some((c) => {
    // Локальная проверка без импорта roles.ts (избегаем цикла): director всегда viewAll.
    const viewAllRoles = ['director', 'technologist', 'supply', 'accountant']
    return viewAllRoles.includes(c)
  })
  if (isDirector || canViewAll) return undefined
  return session.id
}
