/**
 * GET /api/finance/summary
 *
 * Aggregated financial summary for the dashboard.
 * Returns: total balance, income vs expense, budget health, upcoming payments.
 * Query params: projectId (optional — scopes to single project)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    const txWhere: Record<string, unknown> = { deletedAt: null }
    const budgetWhere: Record<string, unknown> = {}
    const paymentWhere: Record<string, unknown> = {}

    if (projectId) {
      txWhere.projectId = projectId
      budgetWhere.projectId = projectId
      paymentWhere.projectId = projectId
    }

    // 1. Income vs Expense totals
    const [incomeAgg, expenseAgg] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...txWhere, type: 'income' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...txWhere, type: 'expense' },
        _sum: { amount: true },
      }),
    ])

    const totalIncome = incomeAgg._sum.amount ?? 0
    const totalExpense = expenseAgg._sum.amount ?? 0

    // 2. Budget totals
    const [budgetAgg, budgetCount] = await Promise.all([
      prisma.budget.aggregate({
        where: budgetWhere,
        _sum: { amount: true },
      }),
      prisma.budget.count({ where: budgetWhere }),
    ])

    const totalBudgeted = budgetAgg._sum.amount ?? 0

    // 3. Upcoming payments (next 30 days)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const upcomingPayments = await prisma.cashFlowPayment.findMany({
      where: {
        ...paymentWhere,
        status: { in: ['planned', 'scheduled'] },
        date: { lte: thirtyDaysFromNow },
      },
      orderBy: { date: 'asc' },
      take: 10,
      include: {
        Counterparty: { select: { id: true, name: true } },
        Project: { select: { id: true, name: true } },
      },
    })

    // 4. Recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: txWhere,
      orderBy: { date: 'desc' },
      take: 10,
      include: {
        Category: { select: { id: true, name: true, type: true } },
        Project: { select: { id: true, name: true } },
        Counterparty: { select: { id: true, name: true } },
      },
    })

    // 5. Transaction count by status
    const [confirmedCount, pendingCount] = await Promise.all([
      prisma.transaction.count({ where: { ...txWhere, status: 'confirmed' } }),
      prisma.transaction.count({ where: { ...txWhere, status: 'pending' } }),
    ])

    // 6. Category breakdown (top 5)
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, type: true },
    })

    const categoryBreakdown = await Promise.all(
      categories.slice(0, 5).map(async (cat) => {
        const agg = await prisma.transaction.aggregate({
          where: { ...txWhere, categoryId: cat.id },
          _sum: { amount: true },
          _count: true,
        })
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          type: cat.type,
          totalAmount: Number(agg._sum.amount ?? 0),
          transactionCount: agg._count,
        }
      })
    )

    return NextResponse.json({
      data: {
        totals: {
          income: totalIncome,
          expense: totalExpense,
          balance: Number(totalIncome) - Number(totalExpense),
        },
        budgets: {
          totalBudgeted,
          budgetCount: budgetCount,
          budgetHealth: Number(totalBudgeted) > 0
            ? Math.round((Number(totalExpense) / Number(totalBudgeted)) * 100)
            : 0,
        },
        payments: {
          upcoming: upcomingPayments.map((p) => ({
            id: p.id,
            date: p.date,
            amount: p.amount,
            type: p.type,
            status: p.status,
            description: p.description,
            counterpartyName: p.Counterparty?.name ?? null,
            projectName: p.Project?.name ?? null,
            dueDate: p.dueDate,
          })),
          upcomingTotal: upcomingPayments.reduce((s, p) => s + Number(p.amount), 0),
        },
        transactions: {
          recent: recentTransactions.map((tx) => ({
            id: tx.id,
            date: tx.date,
            amount: tx.amount,
            type: tx.type,
            description: tx.description,
            status: tx.status,
            categoryName: tx.Category?.name ?? null,
            projectName: tx.Project?.name ?? null,
          })),
          confirmed: confirmedCount,
          pending: pendingCount,
          total: confirmedCount + pendingCount,
        },
        categoryBreakdown: categoryBreakdown
          .filter((c) => c.totalAmount > 0)
          .sort((a, b) => b.totalAmount - a.totalAmount),
      },
    })
  } catch (error) {
    console.error('Failed to compute finance summary:', error)
    return NextResponse.json(
      { error: 'Failed to compute summary', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
