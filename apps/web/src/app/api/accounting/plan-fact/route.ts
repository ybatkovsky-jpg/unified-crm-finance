/**
 * GET /api/accounting/plan-fact?period=&scope=
 *
 * План/факт по статьям расходов и периодам. ACCT-03.
 *
 * План — Budget (projectId = null для орг-плана; если scope=project — проектные).
 * Факт — Transaction(type=expense), GROUP BY categoryId.
 * По каждой статье: план | факт | отклонение | %.
 *
 * Параметры:
 *   period — "2026-01" / "2026-Q1" / "2026" (по умолчанию текущий месяц)
 *   scope  — "org" (по умолчанию, постоянные расходы) | "project" (требует projectId)
 *   projectId — для scope=project
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../../lib/db/prisma'
import { parsePeriodToDateRange } from '../../../../lib/periods'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const scope = searchParams.get('scope') ?? 'org'
    const projectId = searchParams.get('projectId')

    // period по умолчанию — текущий месяц (план ведётся помесячно).
    const now = new Date()
    const period = searchParams.get('period')
      ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const range = parsePeriodToDateRange(period)
    if (!range) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Unsupported period format' },
        { status: 400 }
      )
    }

    const isOrg = scope !== 'project'

    // --- План ---
    const budgetWhere: Prisma.BudgetWhereInput = { period }
    if (isOrg) {
      budgetWhere.projectId = null
    } else {
      if (!projectId) {
        return NextResponse.json(
          { error: 'Validation failed', message: 'projectId is required for scope=project' },
          { status: 400 }
        )
      }
      budgetWhere.projectId = projectId
    }

    const planBudgets = await prisma.budget.findMany({
      where: budgetWhere,
      include: { Category: { select: { id: true, name: true, order: true } } },
    })

    // --- Факт (расходы за период) ---
    const txWhere: Record<string, unknown> = {
      deletedAt: null,
      status: 'confirmed',
      type: 'expense',
      date: { gte: range.start, lte: range.end },
    }
    if (isOrg) {
      txWhere.projectId = null
    } else {
      txWhere.projectId = projectId
    }

    const actualTxs = await prisma.transaction.findMany({
      where: txWhere,
      select: { categoryId: true, amount: true, Category: { select: { name: true } } },
    })

    const actualByCategory = new Map<string, { amount: number; count: number }>()
    for (const t of actualTxs) {
      const e = actualByCategory.get(t.categoryId) ?? { amount: 0, count: 0 }
      e.amount += Number(t.amount)
      e.count += 1
      actualByCategory.set(t.categoryId, e)
    }

    // --- Объединение план + факт по статьям ---
    const seen = new Set<string>()
    const rows: Array<{
      categoryId: string
      categoryName: string
      planned: number
      actual: number
      variance: number
      percentUsed: number
      transactionCount: number
    }> = []

    for (const b of planBudgets) {
      seen.add(b.categoryId)
      const actual = actualByCategory.get(b.categoryId)?.amount ?? 0
      const planned = Number(b.amount)
      rows.push({
        categoryId: b.categoryId,
        categoryName: b.Category.name,
        planned,
        actual,
        variance: planned - actual,
        percentUsed: planned > 0 ? Math.round((actual / planned) * 100) : 0,
        transactionCount: actualByCategory.get(b.categoryId)?.count ?? 0,
      })
    }

    // Статьи с фактом, но без плана (перерасход вне плана).
    for (const [categoryId, e] of actualByCategory) {
      if (seen.has(categoryId)) continue
      const name = actualTxs.find((t) => t.categoryId === categoryId)?.Category.name ?? '—'
      rows.push({
        categoryId,
        categoryName: name,
        planned: 0,
        actual: e.amount,
        variance: -e.amount,
        percentUsed: 0,
        transactionCount: e.count,
      })
    }

    rows.sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'ru'))

    const totalPlanned = rows.reduce((s, r) => s + r.planned, 0)
    const totalActual = rows.reduce((s, r) => s + r.actual, 0)

    return NextResponse.json({
      data: {
        scope: isOrg ? 'org' : 'project',
        projectId: isOrg ? null : projectId,
        period,
        range: { start: range.start, end: range.end },
        rows,
        summary: {
          totalPlanned,
          totalActual,
          totalVariance: totalPlanned - totalActual,
          percentUsed: totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0,
          rowCount: rows.length,
        },
      },
    })
  } catch (error) {
    console.error('Failed to compute plan/fact:', error)
    return NextResponse.json(
      { error: 'Failed to compute plan/fact', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
