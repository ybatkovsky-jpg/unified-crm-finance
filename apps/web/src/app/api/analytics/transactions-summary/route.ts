/**
 * GET /api/analytics/transactions-summary
 *
 * Aggregated transaction summary by category, project, or period.
 * Query params: projectId (optional), period (optional: "month", "quarter", "year"), dateFrom, dateTo
 *
 * Returns: aggregated income/expense by group with totals.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const groupBy = searchParams.get('groupBy') ?? 'category'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = { deletedAt: null }

    if (projectId) where.projectId = projectId
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.date = dateFilter
    }

    // Fetch all matching transactions with relations
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        Category: { select: { id: true, name: true, type: true } },
        Project: { select: { id: true, name: true } },
        Counterparty: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    })

    // Aggregate by group
    const groups: Record<
      string,
      { income: number; expense: number; count: number; transactions: unknown[] }
    > = {}

    for (const tx of transactions) {
      let key: string
      switch (groupBy) {
        case 'project':
          key = tx.Project?.name ?? 'Unassigned'
          break
        case 'category':
        default:
          key = tx.Category?.name ?? 'Unknown'
          break
      }

      if (!groups[key]) groups[key] = { income: 0, expense: 0, count: 0, transactions: [] }
      if (tx.type === 'income') groups[key].income += tx.amount
      else groups[key].expense += tx.amount
      groups[key].count += 1
      groups[key].transactions.push({
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
      })
    }

    // Sort groups by total DESC
    const data = Object.entries(groups)
      .map(([name, val]) => ({
        name,
        income: val.income,
        expense: val.expense,
        netAmount: val.income - val.expense,
        transactionCount: val.count,
      }))
      .sort((a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount))

    // Totals
    const totalIncome = data.reduce((s, g) => s + g.income, 0)
    const totalExpense = data.reduce((s, g) => s + g.expense, 0)

    return NextResponse.json({
      data,
      summary: {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        groupCount: data.length,
        transactionCount: transactions.length,
      },
    })
  } catch (error) {
    console.error('Failed to compute transaction summary:', error)
    return NextResponse.json(
      { error: 'Failed to compute summary', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
