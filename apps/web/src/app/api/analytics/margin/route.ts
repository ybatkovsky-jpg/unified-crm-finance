/**
 * GET /api/analytics/margin
 *
 * Project P&L and margin analysis.
 * Query params: period ("3m","6m","12m","all"), sortBy ("margin","revenue","profit")
 *
 * Returns per-project: revenue, cost, profit, margin%, budget comparison.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') ?? 'all'
    const sortBy = searchParams.get('sortBy') ?? 'profit'
    const limit = parseInt(searchParams.get('limit') ?? '20')

    // Parse period date filter
    let dateFrom: Date | undefined
    const now = new Date()
    switch (period) {
      case '3m': dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1); break
      case '6m': dateFrom = new Date(now.getFullYear(), now.getMonth() - 6, 1); break
      case '12m': dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), 1); break
    }

    const txWhere: Record<string, unknown> = { deletedAt: null }
    if (dateFrom) txWhere.date = { gte: dateFrom }

    // Fetch projects with their transactions
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        status: true,
        contractAmount: true,
        transactions: {
          where: txWhere,
          select: { type: true, amount: true, date: true },
        },
        budgets: {
          select: { amount: true, period: true, categoryId: true },
        },
      },
      take: limit,
    })

    // Compute P&L per project
    const pnlData = projects.map((p) => {
      const income = p.transactions
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + t.amount, 0)
      const expense = p.transactions
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0)
      const profit = income - expense
      const totalBudgeted = p.budgets.reduce((s, b) => s + b.amount, 0)
      const revenue = p.contractAmount ?? 0
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0
      const budgetUsage = totalBudgeted > 0 ? Math.round((expense / totalBudgeted) * 100) : 0

      return {
        projectId: p.id,
        projectName: p.name,
        status: p.status,
        revenue,
        cost: expense,
        profit,
        margin,
        income,
        expense,
        budgeted: totalBudgeted,
        budgetUsage,
        transactionCount: p.transactions.length,
      }
    })

    // Sort
    pnlData.sort((a, b) => {
      switch (sortBy) {
        case 'margin': return b.margin - a.margin
        case 'revenue': return b.revenue - a.revenue
        default: return b.profit - a.profit
      }
    })

    // Summary
    const totalRevenue = pnlData.reduce((s, p) => s + p.revenue, 0)
    const totalCost = pnlData.reduce((s, p) => s + p.cost, 0)
    const totalProfit = pnlData.reduce((s, p) => s + p.profit, 0)
    const avgMargin = pnlData.length > 0
      ? Math.round(pnlData.reduce((s, p) => s + p.margin, 0) / pnlData.length)
      : 0
    const profitableCount = pnlData.filter((p) => p.profit > 0).length
    const unprofitableCount = pnlData.filter((p) => p.profit < 0).length

    // Distribution buckets
    const distribution = {
      negative: pnlData.filter((p) => p.margin < 0).length,
      low: pnlData.filter((p) => p.margin >= 0 && p.margin < 10).length,
      medium: pnlData.filter((p) => p.margin >= 10 && p.margin < 20).length,
      good: pnlData.filter((p) => p.margin >= 20 && p.margin < 30).length,
      excellent: pnlData.filter((p) => p.margin >= 30).length,
    }

    return NextResponse.json({
      data: {
        projects: pnlData,
        top5: pnlData.slice(0, 5),
        bottom5: pnlData.slice(-5).reverse(),
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          avgMargin,
          projectCount: pnlData.length,
          profitableCount,
          unprofitableCount,
        },
        distribution,
      },
    })
  } catch (error) {
    console.error('Failed to compute margin:', error)
    return NextResponse.json(
      { error: 'Failed to compute margin', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
