/**
 * GET /api/analytics/margin
 *
 * Project P&L and margin analysis.
 * Query params: period ("3m","6m","12m","all"), sortBy ("margin","revenue","profit")
 *
 * Returns per-project: revenue, cost, profit, margin%, budget comparison.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { parsePeriodToDateRange } from '@/lib/periods'
import { getSession } from '@/lib/auth/session'
import { analyticsManagerScope } from '@/lib/auth/analytics-rbac'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') ?? 'all'
    const sortBy = searchParams.get('sortBy') ?? 'profit'
    const limit = parseInt(searchParams.get('limit') ?? '20')

    // Parse period date filter (滚动ное окно "3m"/"6m"/"12m" или "all").
    const range = parsePeriodToDateRange(period)

    // RBAC-fix: не-viewAllProjects видят только свои проекты.
    const managerScope = analyticsManagerScope(session)

    const txWhere: Record<string, unknown> = { deletedAt: null }
    if (range) txWhere.date = { gte: range.start, lte: range.end }

    // Fetch projects with their transactions and cost sources
    const projects = await prisma.project.findMany({
      where: { deletedAt: null, ...(managerScope ? { managerId: managerScope } : {}) },
      select: {
        id: true,
        name: true,
        status: true,
        contractAmount: true,
        marginTarget: true,
        Transaction: {
          where: txWhere,
          select: { type: true, amount: true, date: true },
        },
        Budget: {
          select: { amount: true, period: true, categoryId: true },
        },
        // FIN-04: декомпозиция расходов по источникам
        Invoice: { select: { totalAmount: true, paidAt: true } },
        Delivery: { select: { cost: true } },
        ChangeOrder: { select: { amount: true, status: true } },
        DesignerBonus: { select: { amount: true, status: true } },
      },
      take: limit,
    })

    // Compute P&L per project
    const pnlData = projects.map((p) => {
      const income = p.Transaction
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + Number(t.amount), 0)
      const ledgerExpense = p.Transaction
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + Number(t.amount), 0)

      // FIN-04: декомпозиция расходов по источникам.
      const materials = p.Invoice
        .filter((i) => i.paidAt !== null)
        .reduce((s, i) => s + Number(i.totalAmount), 0)
      const delivery = p.Delivery.reduce((s, d) => s + Number(d.cost ?? 0), 0)
      const changeOrders = p.ChangeOrder
        .filter((c) => c.status !== 'cancelled')
        .reduce((s, c) => s + Number(c.amount), 0)
      const designerBonus = p.DesignerBonus && p.DesignerBonus.status === 'paid'
        ? Number(p.DesignerBonus.amount)
        : 0

      // Совокупные расходы = транзакции + доп. источники, не учтённые в ledger.
      // (materials уже обычно отражены как Transaction(expense), поэтому
      // берём максимум ledgerExpense и суммы источников, чтобы не задвоить.)
      const sourceBased = materials + delivery + changeOrders + designerBonus
      const expense = Math.max(ledgerExpense, sourceBased)

      const profit = income - expense
      const totalBudgeted = p.Budget.reduce((s, b) => s + Number(b.amount), 0)
      const revenue = Number(p.contractAmount ?? 0)
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0
      const budgetUsage = totalBudgeted > 0 ? Math.round((expense / totalBudgeted) * 100) : 0

      // FIN-04: порог маржи и флаг низкомаржинальности.
      const marginTargetPct = Math.round((p.marginTarget ?? 0.25) * 100)
      const lowMargin = revenue > 0 && margin < marginTargetPct

      return {
        projectId: p.id,
        projectName: p.name,
        status: p.status,
        revenue,
        cost: expense,
        profit,
        margin,
        marginTargetPct,
        lowMargin,
        income,
        expense,
        expenseBreakdown: { materials, delivery, changeOrders, designerBonus, ledger: ledgerExpense },
        budgeted: totalBudgeted,
        budgetUsage,
        transactionCount: p.Transaction.length,
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

    // FIN-04: алерты по низкомаржинальным проектам (margin < marginTarget).
    const lowMarginAlerts = pnlData
      .filter((p) => p.lowMargin)
      .map((p) => ({
        projectId: p.projectId,
        projectName: p.projectName,
        margin: p.margin,
        target: p.marginTargetPct,
        deficit: p.marginTargetPct - p.margin,
      }))
      .sort((a, b) => b.deficit - a.deficit)

    // PLAT-04: сплит маржи по статусу — текущие (в работе) vs закрытые.
    const isClosed = (s: string) => s === 'completed' || s === 'closed'
    const closed = pnlData.filter((p) => isClosed(p.status))
    const open = pnlData.filter((p) => !isClosed(p.status))
    const marginByStatus = {
      closed: {
        count: closed.length,
        revenue: closed.reduce((s, p) => s + p.revenue, 0),
        profit: closed.reduce((s, p) => s + p.profit, 0),
        avgMargin: closed.length > 0 ? Math.round(closed.reduce((s, p) => s + p.margin, 0) / closed.length) : 0,
      },
      open: {
        count: open.length,
        revenue: open.reduce((s, p) => s + p.revenue, 0),
        profit: open.reduce((s, p) => s + p.profit, 0),
        avgMargin: open.length > 0 ? Math.round(open.reduce((s, p) => s + p.margin, 0) / open.length) : 0,
      },
    }

    return NextResponse.json({
      data: {
        projects: pnlData,
        top5: pnlData.slice(0, 5),
        bottom5: pnlData.slice(-5).reverse(),
        lowMarginAlerts,
        marginByStatus,
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
