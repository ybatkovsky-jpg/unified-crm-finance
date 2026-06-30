/**
 * GET /api/analytics/cashflow
 *
 * Cash flow projection: upcoming planned + scheduled payments.
 * Query params: projectId (optional), months (default: 6)
 *
 * Returns: monthly cash flow forecast with incoming/outgoing totals.
 *
 * RBAC: не-viewAllProjects видят только свои проекты (PLAT-03..05 RBAC fix).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/session'
import { analyticsManagerScope } from '@/lib/auth/analytics-rbac'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const months = parseInt(searchParams.get('months') ?? '6')

    // RBAC: не-viewAllProjects — только свои проекты.
    const managerScope = analyticsManagerScope(session)

    const now = new Date()
    const endDate = new Date(now.getFullYear(), now.getMonth() + months, 0, 23, 59, 59)

    const where: Record<string, unknown> = {
      status: { in: ['planned', 'scheduled'] },
      date: { gte: now, lte: endDate },
    }

    if (projectId) {
      where.projectId = projectId
    }

    // RBAC: фильтр по менеджеру через связь Project.
    if (managerScope) {
      where.Project = { managerId: managerScope }
    }

    const payments = await prisma.cashFlowPayment.findMany({
      where,
      include: {
        Counterparty: { select: { id: true, name: true } },
        Project: { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    })

    // Group by month
    const monthly: Record<string, { income: number; expense: number; payments: typeof payments }> = {}

    for (const p of payments) {
      const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, '0')}`
      if (!monthly[key]) monthly[key] = { income: 0, expense: 0, payments: [] }
      if (p.type === 'income') monthly[key].income += Number(p.amount)
      else monthly[key].expense += Number(p.amount)
      monthly[key].payments.push(p)
    }

    const data = Object.entries(monthly).map(([month, val]) => ({
      month,
      income: val.income,
      expense: val.expense,
      netCashFlow: val.income - val.expense,
      paymentCount: val.payments.length,
    }))

    // Totals
    const totalIncome = payments.filter(p => p.type === 'income').reduce((s, p) => s + Number(p.amount), 0)
    const totalExpense = payments.filter(p => p.type !== 'income').reduce((s, p) => s + Number(p.amount), 0)

    return NextResponse.json({
      data,
      summary: {
        totalIncome,
        totalExpense,
        netCashFlow: totalIncome - totalExpense,
        monthCount: data.length,
      },
    })
  } catch (error) {
    console.error('Failed to compute cashflow:', error)
    return NextResponse.json(
      { error: 'Failed to compute cashflow', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
