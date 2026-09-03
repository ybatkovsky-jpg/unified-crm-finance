/**
 * Global Search API (UI-02)
 *
 * GET /api/search?q=... — поиск по сделкам, контактам, проектам и договорам.
 * Возвращает сгруппированные результаты (первые 5 по каждой сущности).
 *
 * Регистронезависимость выполняется в JS (toLowerCase) — надёжно для кириллицы,
 * т.к. PostgreSQL ILIKE под C/en_US collation не складывает регистр кириллицы.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { canViewAllProjects } from '@/lib/auth/roles'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const q = (request.nextUrl.searchParams.get('q') ?? '').trim().toLowerCase()
    if (!q) {
      return NextResponse.json({ data: { deals: [], contacts: [], projects: [], contracts: [] } })
    }

    const viewAll = canViewAllProjects(session.roleCodes)
    const scope = viewAll ? {} : { managerId: session.id }

    // Берём недавние записи и фильтруем в JS по регистронезависимому совпадению
    // (кириллица не складывается ILIKE под текущей collation).
    const [contacts, deals, projects, contracts] = await Promise.all([
      prisma.contact.findMany({
        where: { deletedAt: null },
        select: { id: true, firstName: true, lastName: true, companyName: true, type: true, phone: true },
        take: 200,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.deal.findMany({
        where: { deletedAt: null, ...scope },
        select: { id: true, title: true, number: true, amount: true, currency: true },
        take: 200,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.project.findMany({
        where: { deletedAt: null, ...scope },
        select: { id: true, name: true, externalNumber: true },
        take: 200,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.contract.findMany({
        where: { deletedAt: null },
        select: { id: true, title: true, number: true },
        take: 200,
        orderBy: { updatedAt: 'desc' },
      }),
    ])

    const match = (s: string | null | undefined) => (s ?? '').toLowerCase().includes(q)

    const filteredContacts = contacts
      .filter((c) => match(c.firstName) || match(c.lastName) || match(c.companyName) || match(c.phone))
      .slice(0, 5)
    const filteredDeals = deals
      .filter((d) => match(d.title) || match(d.number))
      .slice(0, 5)
    const filteredProjects = projects
      .filter((p) => match(p.name) || match(p.externalNumber))
      .slice(0, 5)
    const filteredContracts = contracts
      .filter((c) => match(c.title) || match(c.number))
      .slice(0, 5)

    return NextResponse.json({
      data: {
        contacts: filteredContacts,
        deals: filteredDeals,
        projects: filteredProjects,
        contracts: filteredContracts,
      },
    })
  } catch (error) {
    console.error('Failed to search:', error)
    return NextResponse.json(
      { error: 'Failed to search', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
