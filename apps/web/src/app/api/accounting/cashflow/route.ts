/**
 * GET /api/accounting/cashflow?period=
 *
 * ДДС (движение денежных средств) — план/факт по месяцам периода. ACCT-04.
 * Отличие от P&L: привязка к моменту движения денег (не начислению).
 *
 * План — CashFlowPayment(status in planned/scheduled), по дате платежа.
 * Факт — Transaction(status=confirmed), по дате проводки.
 * Разбивка по месяцам: приток (income) / отток (expense), сальдо.
 *
 * period по умолчанию — текущий квартал.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db/prisma'
import { parsePeriodToDateRange, monthsInRange } from '../../../../lib/periods'

const now0 = () => new Date()

function defaultQuarterPeriod(): string {
  const d = now0()
  const q = Math.floor(d.getMonth() / 3) + 1
  return `${d.getFullYear()}-Q${q}`
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') ?? defaultQuarterPeriod()

    const range = parsePeriodToDateRange(period)
    if (!range) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Unsupported period format' },
        { status: 400 }
      )
    }

    const months = monthsInRange(period)

    // --- План: плановые/запланированные платежи ---
    const plannedPayments = await prisma.cashFlowPayment.findMany({
      where: {
        status: { in: ['planned', 'scheduled'] },
        date: { gte: range.start, lte: range.end },
      },
      select: { type: true, amount: true, date: true },
    })

    // --- Факт: подтверждённые транзакции ---
    const actualTxs = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        status: 'confirmed',
        date: { gte: range.start, lte: range.end },
      },
      select: { type: true, amount: true, date: true },
    })

    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    // По месяцам: { planned: {in,out}, actual: {in,out} }
    type Bucket = { plannedIn: number; plannedOut: number; actualIn: number; actualOut: number }
    const buckets = new Map<string, Bucket>()
    for (const m of months) {
      buckets.set(m, { plannedIn: 0, plannedOut: 0, actualIn: 0, actualOut: 0 })
    }

    const touch = (key: string): Bucket => {
      let b = buckets.get(key)
      if (!b) {
        b = { plannedIn: 0, plannedOut: 0, actualIn: 0, actualOut: 0 }
        buckets.set(key, b)
      }
      return b
    }

    for (const p of plannedPayments) {
      const b = touch(monthKey(p.date))
      if (p.type === 'income') b.plannedIn += Number(p.amount)
      else b.plannedOut += Number(p.amount)
    }
    for (const t of actualTxs) {
      const b = touch(monthKey(t.date))
      if (t.type === 'income') b.actualIn += Number(t.amount)
      else b.actualOut += Number(t.amount)
    }

    const monthly = months.map((m) => {
      const b = buckets.get(m)!
      return {
        month: m,
        planned: { income: b.plannedIn, expense: b.plannedOut, net: b.plannedIn - b.plannedOut },
        actual: { income: b.actualIn, expense: b.actualOut, net: b.actualIn - b.actualOut },
      }
    })

    const totalPlannedIn = monthly.reduce((s, m) => s + m.planned.income, 0)
    const totalPlannedOut = monthly.reduce((s, m) => s + m.planned.expense, 0)
    const totalActualIn = monthly.reduce((s, m) => s + m.actual.income, 0)
    const totalActualOut = monthly.reduce((s, m) => s + m.actual.expense, 0)

    return NextResponse.json({
      data: {
        period,
        range: { start: range.start, end: range.end },
        monthly,
        summary: {
          planned: {
            income: totalPlannedIn,
            expense: totalPlannedOut,
            net: totalPlannedIn - totalPlannedOut,
          },
          actual: {
            income: totalActualIn,
            expense: totalActualOut,
            net: totalActualIn - totalActualOut,
          },
          monthCount: monthly.length,
        },
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
