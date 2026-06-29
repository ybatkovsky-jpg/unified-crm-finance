/**
 * GET /api/accounting/pnl?period=
 *
 * P&L (прибыли/убытки) организации за период. ACCT-02.
 *
 * Доходы — Transaction(type=income). Расходы — Transaction(type=expense),
 * с разбивкой на постоянные (projectId = null, орг-учёт) и проектные (projectId задан).
 * Группировка по статьям (Category). period через parsePeriodToDateRange.
 *
 * Возвращает: статьи доходов/расходов с суммами, итоги, прибыль/убыток.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db/prisma'
import { parsePeriodToDateRange } from '../../../../lib/periods'

interface ArticleRow {
  categoryId: string
  categoryName: string
  amount: number
  transactionCount: number
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') ?? '12m'

    const range = parsePeriodToDateRange(period)

    // Базовый фильтр: подтверждённые, не удалённые транзакции в периоде.
    const where: Record<string, unknown> = { deletedAt: null, status: 'confirmed' }
    if (range) where.date = { gte: range.start, lte: range.end }

    const txs = await prisma.transaction.findMany({
      where,
      select: {
        type: true,
        amount: true,
        projectId: true,
        categoryId: true,
        Category: { select: { id: true, name: true, order: true } },
      },
    })

    // Группировка: доходы / постоянные расходы / проектные расходы — по статьям.
    const incomeMap = new Map<string, ArticleRow>()
    const constantMap = new Map<string, ArticleRow>()
    const projectMap = new Map<string, ArticleRow>()

    for (const t of txs) {
      const key = t.categoryId
      const map = t.type === 'income'
        ? incomeMap
        : t.projectId === null
          ? constantMap
          : projectMap
      let row = map.get(key)
      if (!row) {
        row = {
          categoryId: t.categoryId,
          categoryName: t.Category.name,
          amount: 0,
          transactionCount: 0,
        }
        map.set(key, row)
      }
      row.amount += Number(t.amount)
      row.transactionCount += 1
    }

    const byOrder = (a: ArticleRow, b: ArticleRow) => a.categoryName.localeCompare(b.categoryName, 'ru')

    const income = [...incomeMap.values()].sort(byOrder)
    const constantExpenses = [...constantMap.values()].sort(byOrder)
    const projectExpenses = [...projectMap.values()].sort(byOrder)

    const totalIncome = income.reduce((s, r) => s + r.amount, 0)
    const totalConstant = constantExpenses.reduce((s, r) => s + r.amount, 0)
    const totalProject = projectExpenses.reduce((s, r) => s + r.amount, 0)
    const totalExpenses = totalConstant + totalProject
    const netProfit = totalIncome - totalExpenses

    // УСН 15% (расчётно): если доход/расход положительный — прикидка налога.
    const usnTaxBase = Math.max(0, totalIncome - totalExpenses)
    const usnTax15 = Math.round(usnTaxBase * 0.15)
    const usnTaxMin = Math.round(totalIncome * 0.01) // мин. 1% от дохода
    const estimatedTax = Math.max(usnTax15, usnTaxMin)

    return NextResponse.json({
      data: {
        period,
        range: range ? { start: range.start, end: range.end } : null,
        income,
        constantExpenses,
        projectExpenses,
        summary: {
          totalIncome,
          totalConstantExpenses: totalConstant,
          totalProjectExpenses: totalProject,
          totalExpenses,
          netProfit,
          marginPct: totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0,
        },
        // Прикидка налога УСН — ориентир, не финрезультат (учёт в 1С).
        estimatedUsnTax: {
          base: usnTaxBase,
          tax15: usnTax15,
          min1pct: usnTaxMin,
          applicable: estimatedTax,
        },
      },
    })
  } catch (error) {
    console.error('Failed to compute P&L:', error)
    return NextResponse.json(
      { error: 'Failed to compute P&L', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
