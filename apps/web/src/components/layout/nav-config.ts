/**
 * Navigation configuration — single source of truth for the app shell.
 *
 * Used by both the Sidebar (renders sections + icons) and the Topbar (renders
 * the active section's children as a sub-nav). Grouping mirrors the route
 * tree under src/app/(app).
 */

import type { LucideIcon } from "lucide-react"
import {
  Users,
  ShoppingCart,
  Wallet,
  BarChart3,
  Settings,
  LayoutDashboard,
  Contact,
  Handshake,
  FolderKanban,
  Building2,
  FileText,
  CheckSquare,
  Package,
  Truck,
  Receipt,
  ArrowRightLeft,
  CreditCard,
  Split,
  Gauge,
  TrendingUp,
  Boxes,
  UserCog,
  Landmark,
  Scale,
  Calculator,
  FileBarChart,
  GitCompareArrows,
  Banknote,
  Tags,
  ListTodo,
  CalendarClock,
  UsersRound,
  Network,
} from "lucide-react"

export interface NavChild {
  label: string
  href: string
  icon: LucideIcon
}

export interface NavSection {
  /** Stable id used as framer-motion layoutId + active-section key. */
  id: string
  label: string
  /** Root path used to detect which section is active. */
  matchPrefix: string
  icon: LucideIcon
  /** Director-only sections are filtered out for other roles. */
  directorOnly?: boolean
  children: NavChild[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "crm",
    label: "CRM",
    matchPrefix: "/crm",
    icon: LayoutDashboard,
    children: [
      { label: "Контакты", href: "/crm/contacts", icon: Contact },
      { label: "Сделки", href: "/deals", icon: Handshake },
      { label: "Проекты", href: "/projects", icon: FolderKanban },
      { label: "Договоры", href: "/contracts", icon: FileText },
    ],
  },
  {
    id: "tasks",
    label: "Задачи",
    matchPrefix: "/tasks",
    icon: ListTodo,
    children: [
      { label: "Мои задачи", href: "/tasks", icon: CheckSquare },
      { label: "Просроченные", href: "/tasks/overdue", icon: CalendarClock },
      { label: "Все задачи", href: "/tasks/all", icon: UsersRound },
    ],
  },
  {
    id: "org",
    label: "Орг-платформа",
    matchPrefix: "/org",
    icon: Network,
    children: [
      { label: "Доска задач", href: "/org/board", icon: ListTodo },
      { label: "Шаблоны задач", href: "/org/templates", icon: CalendarClock },
      { label: "Структура", href: "/org/structure", icon: Network },
    ],
  },
  {
    id: "procurement",
    label: "Закупки",
    matchPrefix: "/procurement",
    icon: ShoppingCart,
    children: [
      { label: "Контрагенты", href: "/procurement/counterparties", icon: Building2 },
      { label: "Заявки", href: "/procurement/purchase-requests", icon: FileText },
      { label: "Счета", href: "/procurement/invoices", icon: Receipt },
      { label: "Согласование", href: "/procurement/approvals", icon: CheckSquare },
      { label: "Склад", href: "/procurement/warehouse", icon: Package },
      { label: "Поставки", href: "/procurement/deliveries", icon: Truck },
    ],
  },
  {
    id: "finance",
    label: "Финансы",
    matchPrefix: "/finance",
    icon: Wallet,
    children: [
      { label: "Обзор", href: "/finance", icon: LayoutDashboard },
      { label: "Транзакции", href: "/finance/transactions", icon: ArrowRightLeft },
      { label: "Платежи", href: "/finance/payments", icon: CreditCard },
      { label: "Банк-выписки", href: "/finance/statements", icon: Landmark },
      { label: "Долги", href: "/finance/debts", icon: Scale },
      { label: "Категории", href: "/finance/categories", icon: Split },
    ],
  },
  {
    id: "accounting",
    label: "Учёт",
    matchPrefix: "/accounting",
    icon: Calculator,
    children: [
      { label: "Обзор", href: "/accounting", icon: LayoutDashboard },
      { label: "P&L", href: "/accounting/pnl", icon: FileBarChart },
      { label: "План/факт", href: "/accounting/plan-fact", icon: GitCompareArrows },
      { label: "ДДС", href: "/accounting/cashflow", icon: Banknote },
      { label: "Статьи расходов", href: "/accounting/articles", icon: Tags },
    ],
  },
  {
    id: "analytics",
    label: "Аналитика",
    matchPrefix: "/analytics",
    icon: BarChart3,
    children: [
      { label: "Обзор", href: "/analytics", icon: LayoutDashboard },
      { label: "Воронка", href: "/analytics/funnel", icon: Split },
      { label: "Маржа", href: "/analytics/margin", icon: Gauge },
      { label: "Закупки", href: "/analytics/procurement", icon: Boxes },
      { label: "Команда", href: "/analytics/team", icon: TrendingUp },
    ],
  },
  {
    id: "settings",
    label: "Настройки",
    matchPrefix: "/settings",
    icon: Settings,
    directorOnly: true,
    children: [
      { label: "Пользователи", href: "/settings/users", icon: UserCog },
    ],
  },
]

/**
 * Resolve the active nav section for a given pathname.
 * Falls back to "crm" (the app default route) when nothing matches.
 */
export function getActiveSection(pathname: string, isDirector: boolean): NavSection {
  const sections = NAV_SECTIONS.filter((s) => (s.directorOnly ? isDirector : true))
  return (
    sections.find((s) => pathname === s.matchPrefix || pathname.startsWith(s.matchPrefix + "/")) ??
    sections[0]
  )
}

/** Users icon re-exported for the sidebar footer avatar fallback. */
export { Users }
