/**
 * GET /api/analytics/budget-vs-actual
 *
 * Compares budgeted amounts vs actual transaction sums per project/period.
 * Query params: projectId (required)
 *
 * Returns: per-budget comparison with budget amount, actual spend, variance.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db/prisma'
import { parsePeriodToDateRange } from '../../../../lib/periods'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'projectId is required' },
        { status: 400 }
      )
    }

    // Fetch all budgets for this project
    const budgets = await prisma.budget.findMany({
      where: { projectId },
      include: {
        Category: { select: { id: true, name: true, type: true } },
      },
      orderBy: { period: 'desc' },
    })

    // N+1 fix: batch all transactions for this project, then match in memory.
    const allTx = await prisma.transaction.findMany({
      where: { projectId, deletedAt: null },
      select: { categoryId: true, amount: true, date: true },
    })

    // For each budget, sum transactions in same category during same period
    const comparison = budgets.map((budget) => {
      const periodDate = parsePeriodToDateRange(budget.period)

      const actual = allTx
        .filter((tx) => {
          if (tx.categoryId !== budget.categoryId) return false
          if (!periodDate) return true
          const d = new Date(tx.date)
          return d >= periodDate.start && d <= periodDate.end
        })
        .reduce((sum, tx) => sum + Number(tx.amount), 0)

      const variance = Number(budget.amount) - actual

      return {
        budgetId: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.Category.name,
        categoryType: budget.Category.type,
        period: budget.period,
        budgeted: budget.amount,
        actual,
        variance,
        percentUsed: Number(budget.amount) > 0 ? Math.round((actual / Number(budget.amount)) * 100) : 0,
      }
    })

    return NextResponse.json({ data: comparison })
  } catch (error) {
    console.error('Failed to compute budget vs actual:', error)
    return NextResponse.json(
      { error: 'Failed to compute analytics', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
