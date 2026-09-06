/**
 * Entity search API for searchable selects (SS-01).
 *
 * GET /api/search/entities?type=contact|counterparty|contract|project|user|deal&q=...&ids=...&limit=...
 *
 * - q: search string (case-insensitive, incl. Cyrillic — JS lowercase filter,
 *      как в /api/search, т.к. ILIKE под C-collation не складывает регистр кириллицы).
 * - ids: comma-separated IDs для резолва текущего значения (label выбранной записи в edit-формах).
 * - limit: max items (default 20, max 50).
 * - counterpartyType: фильтр по типу контрагента (supplier | production | ...).
 * - contactType: фильтр по типу контакта (person | company).
 *
 * Возвращает { data: [{ id, label, sublabel }] }.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { canViewAllProjects } from '@/lib/auth/roles'

const TYPES = ['contact', 'counterparty', 'contract', 'project', 'user', 'deal'] as const
type EntityType = (typeof TYPES)[number]

export interface EntitySearchItem {
  id: string
  label: string
  sublabel?: string | null
}

function isEntityType(value: string | null): value is EntityType {
  return !!value && (TYPES as readonly string[]).includes(value)
}

function matchQuery(value: string | null | undefined, q: string): boolean {
  return (value ?? '').toLowerCase().includes(q)
}

/** Отображаемое имя контакта: физлицо → "Имя Фамилия", юрлицо → компания. */
export function getContactDisplayName(c: {
  type: string
  firstName?: string | null
  lastName?: string | null
  companyName?: string | null
}): string {
  if (c.type === 'person') {
    const parts = [c.firstName, c.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : 'Без имени'
  }
  return c.companyName || 'Без названия'
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sp = request.nextUrl.searchParams
    const type = sp.get('type')
    if (!isEntityType(type)) {
      return NextResponse.json(
        { error: 'Invalid type', message: `type must be one of: ${TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const q = (sp.get('q') ?? '').trim().toLowerCase()
    const ids = (sp.get('ids') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50)
    const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') ?? '20', 10) || 20))
    const counterpartyType = (sp.get('counterpartyType') ?? '').trim() || undefined
    const contactType = (sp.get('contactType') ?? '').trim() || undefined

    const viewAll = canViewAllProjects(session.roleCodes)
    // Менеджер без viewAllProjects видит только свои проекты (как в /api/search).
    const managerScope = viewAll ? {} : { managerId: session.id }

    // ── Контакты ──────────────────────────────────────────────────────────────
    if (type === 'contact') {
      const contactWhere: Record<string, unknown> = { deletedAt: null }
      if (contactType === 'person' || contactType === 'company') contactWhere.type = contactType

      const [all, byIds] = await Promise.all([
        prisma.contact.findMany({
          where: contactWhere,
          select: {
            id: true, type: true, firstName: true, lastName: true, companyName: true,
            phone: true, email: true, inn: true,
          },
          take: 500,
          orderBy: { updatedAt: 'desc' },
        }),
        ids.length
          ? prisma.contact.findMany({
              where: { id: { in: ids } },
              select: {
                id: true, type: true, firstName: true, lastName: true, companyName: true,
                phone: true, email: true, inn: true,
              },
            })
          : Promise.resolve([]),
      ])

      const toItem = (c: (typeof all)[number]): EntitySearchItem => ({
        id: c.id,
        label: getContactDisplayName(c),
        sublabel: [c.phone, c.email, c.inn].filter(Boolean)[0] ?? null,
      })

      const byIdsItems = byIds.map(toItem)
      const result = (
        q
          ? all
              .filter((c) => !byIds.some((b) => b.id === c.id))
              .filter(
                (c) =>
                  matchQuery(c.firstName, q) ||
                  matchQuery(c.lastName, q) ||
                  matchQuery(c.companyName, q) ||
                  matchQuery(c.phone, q) ||
                  matchQuery(c.email, q) ||
                  matchQuery(c.inn, q)
              )
          : all.filter((c) => !byIds.some((b) => b.id === c.id))
      ).map(toItem)

      return NextResponse.json({
        data: [...byIdsItems, ...result].slice(0, limit),
      })
    }

    // ── Контрагенты ───────────────────────────────────────────────────────────
    if (type === 'counterparty') {
      const where: Record<string, unknown> = { deletedAt: null }
      if (counterpartyType) where.type = counterpartyType

      const [all, byIds] = await Promise.all([
        prisma.counterparty.findMany({
          where,
          select: { id: true, name: true, inn: true },
          take: 500,
          orderBy: { updatedAt: 'desc' },
        }),
        ids.length
          ? prisma.counterparty.findMany({
              where: { id: { in: ids } },
              select: { id: true, name: true, inn: true },
            })
          : Promise.resolve([]),
      ])

      const toItem = (c: { id: string; name: string; inn: string | null }): EntitySearchItem => ({
        id: c.id,
        label: c.name,
        sublabel: c.inn ? `ИНН ${c.inn}` : null,
      })

      const byIdsItems = byIds.map(toItem)
      const result = (
        q
          ? all
              .filter((c) => !byIds.some((b) => b.id === c.id))
              .filter((c) => matchQuery(c.name, q) || matchQuery(c.inn, q))
          : all.filter((c) => !byIds.some((b) => b.id === c.id))
      ).map(toItem)

      return NextResponse.json({
        data: [...byIdsItems, ...result].slice(0, limit),
      })
    }

    // ── Договоры ──────────────────────────────────────────────────────────────
    if (type === 'contract') {
      const [all, byIds] = await Promise.all([
        prisma.contract.findMany({
          where: { deletedAt: null },
          select: { id: true, number: true, title: true },
          take: 500,
          orderBy: { updatedAt: 'desc' },
        }),
        ids.length
          ? prisma.contract.findMany({
              where: { id: { in: ids } },
              select: { id: true, number: true, title: true },
            })
          : Promise.resolve([]),
      ])

      const toItem = (c: { id: string; number: string; title: string }): EntitySearchItem => ({
        id: c.id,
        label: c.title,
        sublabel: `№ ${c.number}`,
      })

      const byIdsItems = byIds.map(toItem)
      const result = (
        q
          ? all
              .filter((c) => !byIds.some((b) => b.id === c.id))
              .filter((c) => matchQuery(c.title, q) || matchQuery(c.number, q))
          : all.filter((c) => !byIds.some((b) => b.id === c.id))
      ).map(toItem)

      return NextResponse.json({
        data: [...byIdsItems, ...result].slice(0, limit),
      })
    }

    // ── Проекты ───────────────────────────────────────────────────────────────
    if (type === 'project') {
      const [all, byIds] = await Promise.all([
        prisma.project.findMany({
          where: { deletedAt: null, ...managerScope },
          select: { id: true, name: true, externalNumber: true },
          take: 500,
          orderBy: { updatedAt: 'desc' },
        }),
        ids.length
          ? prisma.project.findMany({
              where: { id: { in: ids }, ...managerScope },
              select: { id: true, name: true, externalNumber: true },
            })
          : Promise.resolve([]),
      ])

      const toItem = (p: { id: string; name: string; externalNumber: string }): EntitySearchItem => ({
        id: p.id,
        label: p.name,
        sublabel: p.externalNumber,
      })

      const byIdsItems = byIds.map(toItem)
      const result = (
        q
          ? all
              .filter((p) => !byIds.some((b) => b.id === p.id))
              .filter((p) => matchQuery(p.name, q) || matchQuery(p.externalNumber, q))
          : all.filter((p) => !byIds.some((b) => b.id === p.id))
      ).map(toItem)

      return NextResponse.json({
        data: [...byIdsItems, ...result].slice(0, limit),
      })
    }

    // ── Пользователи (менеджеры/исполнители) ──────────────────────────────────
    if (type === 'user') {
      const [all, byIds] = await Promise.all([
        prisma.user.findMany({
          where: { deletedAt: null, isActive: true },
          select: { id: true, name: true, email: true },
          take: 500,
          orderBy: { name: 'asc' },
        }),
        ids.length
          ? prisma.user.findMany({
              where: { id: { in: ids } },
              select: { id: true, name: true, email: true },
            })
          : Promise.resolve([]),
      ])

      const toItem = (u: { id: string; name: string; email: string }): EntitySearchItem => ({
        id: u.id,
        label: u.name || u.email,
        sublabel: u.email,
      })

      const byIdsItems = byIds.map(toItem)
      const result = (
        q
          ? all
              .filter((u) => !byIds.some((b) => b.id === u.id))
              .filter((u) => matchQuery(u.name, q) || matchQuery(u.email, q))
          : all.filter((u) => !byIds.some((b) => b.id === u.id))
      ).map(toItem)

      return NextResponse.json({
        data: [...byIdsItems, ...result].slice(0, limit),
      })
    }

    // ── Сделки ────────────────────────────────────────────────────────────────
    const [all, byIds] = await Promise.all([
      prisma.deal.findMany({
        where: { deletedAt: null, ...managerScope },
        select: { id: true, title: true, number: true },
        take: 500,
        orderBy: { updatedAt: 'desc' },
      }),
      ids.length
        ? prisma.deal.findMany({
            where: { id: { in: ids }, ...managerScope },
            select: { id: true, title: true, number: true },
          })
        : Promise.resolve([]),
    ])

    const toItem = (d: { id: string; title: string; number: string }): EntitySearchItem => ({
      id: d.id,
      label: d.title,
      sublabel: `№ ${d.number}`,
    })

    const byIdsItems = byIds.map(toItem)
    const result = (
      q
        ? all
            .filter((d) => !byIds.some((b) => b.id === d.id))
            .filter((d) => matchQuery(d.title, q) || matchQuery(d.number, q))
        : all.filter((d) => !byIds.some((b) => b.id === d.id))
    ).map(toItem)

    return NextResponse.json({
      data: [...byIdsItems, ...result].slice(0, limit),
    })
  } catch (error) {
    console.error('Failed to search entities:', error)
    return NextResponse.json(
      { error: 'Failed to search entities', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
