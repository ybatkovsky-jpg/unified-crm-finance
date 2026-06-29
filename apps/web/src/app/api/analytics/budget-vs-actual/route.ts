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

    // For each budget, sum transactions in same category during same period
    const comparison = await Promise.all(
      budgets.map(async (budget) => {
        const periodDate = parsePeriodToDateRange(budget.period)

        const actualSum = await prisma.transaction.aggregate({
          where: {
            categoryId: budget.categoryId,
            projectId: budget.projectId,
            deletedAt: null,
            ...(periodDate
              ? {
                  date: {
                    gte: periodDate.start,
                    lte: periodDate.end,
                  },
                }
              : {}),
          },
          _sum: { amount: true },
        })

        const actual = Number(actualSum._sum.amount ?? 0)
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
    )

    return NextResponse.json({ data: comparison })
  } catch (error) {
    console.error('Failed to compute budget vs actual:', error)
    return NextResponse.json(
      { error: 'Failed to compute analytics', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Parse period string to date range.
 * "2026" → entire year, "2026-Q1" → Jan-Mar, "2026-01" → single month.
 */
function parsePeriodToDateRange(period: string): { start: Date; end: Date } | null {
  if (period.match(/^\d{4}$/)) {
    const y = parseInt(period)
    return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59) }
  }
  if (period.match(/^\d{4}-Q[1-4]$/)) {
    const [, y, q] = period.match(/^(\d{4})-Q([1-4])$/)!
    const qs = parseInt(q)
    return {
      start: new Date(parseInt(y), (qs - 1) * 3, 1),
      end: new Date(parseInt(y), qs * 3, 0, 23, 59, 59),
    }
  }
  if (period.match(/^\d{4}-\d{2}$/)) {
    const [, y, m] = period.match(/^(\d{4})-(\d{2})$/)!
    return {
      start: new Date(parseInt(y), parseInt(m) - 1, 1),
      end: new Date(parseInt(y), parseInt(m), 0, 23, 59, 59),
    }
  }
  return null
}
