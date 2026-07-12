/**
 * Домашние (landing) страницы для каждого раздела.
 *
 * Используется:
 *  - middleware.ts: редирект после логина
 *  - sidebar.tsx:  навигация при клике на раздел
 */
export const SECTION_HOME: Record<string, string> = {
  crm: '/deals',
  tasks: '/tasks',
  org: '/org/board',
  procurement: '/procurement',
  finance: '/finance',
  accounting: '/accounting',
  analytics: '/analytics',
  settings: '/settings',
}
