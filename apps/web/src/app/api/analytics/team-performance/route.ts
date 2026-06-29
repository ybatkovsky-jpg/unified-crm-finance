/**
 * GET /api/analytics/team-performance
 *
 * Эффективность и нагрузка команды (PLAT-05): сделки (сумма/конверсия/win-rate),
 * активные/просроченные задачи, активные проекты. По каждому пользователю.
 * Query params: period, pipelineId (optional).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db/prisma'
import { parsePeriodToDateRange } from '../../../../lib/periods'

interface UserPerf {
  userId: string
  userName: string
  // Сделки
  dealCount: number
  totalAmount: number
  avgAmount: number
  conversion: number
  wonCount: number
  lostCount: number
  wonAmount: number
  winRate: number
  // Нагрузка
  activeTaskCount: number
  overdueTaskCount: number
  activeProjectCount: number
  interactionCount: number
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') ?? 'all'
    const pipelineId = searchParams.get('pipelineId')

    const range = parsePeriodToDateRange(period)

    const users = await prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true, email: true },
    })

    // Все стадии для определения won/lost/conversion.
    const stages = await prisma.dealStage.findMany({
      where: pipelineId ? { pipelineId } : {},
      orderBy: { order: 'asc' },
    })
    const wonStageIds = stages.filter((s) => s.isWonStage).map((s) => s.id)
    const lostStageIds = stages.filter((s) => s.isLostStage).map((s) => s.id)
    const firstStage = stages[0]

    const performance = await Promise.all(
      users.map(async (user): Promise<UserPerf | null> => {
        const dealWhere: Record<string, unknown> = { managerId: user.id }
        if (pipelineId) dealWhere.pipelineId = pipelineId
        if (range) dealWhere.createdAt = { gte: range.start, lte: range.end }

        const deals = await prisma.deal.findMany({
          where: dealWhere,
          select: { id: true, amount: true, stageId: true },
        })

        // Нагрузка: задачи (без фильтра по периоду — текущая нагрузка).
        const taskWhere = { assigneeId: user.id, deletedAt: null }
        const [activeTaskCount, overdueTaskCount, activeProjectCount, interactionCount] = await Promise.all([
          prisma.task.count({
            where: { ...taskWhere, status: { notIn: ['done', 'cancelled', 'failed'] } },
          }),
          prisma.task.count({
            where: {
              ...taskWhere,
              status: { notIn: ['done', 'cancelled', 'failed'] },
              dueDate: { lt: new Date() },
            },
          }),
          prisma.project.count({
            where: { managerId: user.id, deletedAt: null, status: { notIn: ['completed', 'closed'] } },
          }),
          prisma.interaction.count({
            where: {
              authorId: user.id,
              ...(range ? { createdAt: { gte: range.start, lte: range.end } } : {}),
            },
          }),
        ])

        // Не показываем пользователей без активности (нет сделок И задач И проектов).
        if (deals.length === 0 && activeTaskCount === 0 && activeProjectCount === 0) {
          return null
        }

        const totalAmount = deals.reduce((s, d) => s + Number(d.amount ?? 0), 0)
        const avgAmount = deals.length > 0 ? totalAmount / deals.length : 0

        const wonDeals = deals.filter((d) => wonStageIds.includes(d.stageId))
        const lostDeals = deals.filter((d) => lostStageIds.includes(d.stageId))
        const wonCount = wonDeals.length
        const lostCount = lostDeals.length
        const wonAmount = wonDeals.reduce((s, d) => s + Number(d.amount ?? 0), 0)
        // Win-rate = won / (won + lost); если нет закрытых — 0.
        const decided = wonCount + lostCount
        const winRate = decided > 0 ? Math.round((wonCount / decided) * 100) : 0

        // Конверсия: сделки в последней стадии / всего.
        const dealsInLast = firstStage ? deals.filter((d) => d.stageId === stages[stages.length - 1].id).length : 0
        const conversion = deals.length > 0 ? Math.round((dealsInLast / deals.length) * 100) : 0

        return {
          userId: user.id,
          userName: user.name ?? user.email,
          dealCount: deals.length,
          totalAmount,
          avgAmount,
          conversion,
          wonCount,
          lostCount,
          wonAmount,
          winRate,
          activeTaskCount,
          overdueTaskCount,
          activeProjectCount,
          interactionCount,
        }
      })
    )

    const filtered = performance
      .filter((p): p is UserPerf => p !== null)
      .sort((a, b) => b.totalAmount - a.totalAmount)

    const totalDeals = filtered.reduce((s, p) => s + p.dealCount, 0)
    const totalAmount = filtered.reduce((s, p) => s + p.totalAmount, 0)
    const avgConversion = filtered.length > 0
      ? Math.round(filtered.reduce((s, p) => s + p.conversion, 0) / filtered.length)
      : 0
    const totalWon = filtered.reduce((s, p) => s + p.wonAmount, 0)
    const totalOverdue = filtered.reduce((s, p) => s + p.overdueTaskCount, 0)

    return NextResponse.json({
      data: {
        managers: filtered,
        summary: {
          totalDeals,
          totalAmount,
          avgConversion,
          managerCount: filtered.length,
          totalWonAmount: totalWon,
          totalOverdueTasks: totalOverdue,
        },
      },
    })
  } catch (error) {
    console.error('Failed to compute team performance:', error)
    return NextResponse.json(
      { error: 'Failed to compute performance', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
