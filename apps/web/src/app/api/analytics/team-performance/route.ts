/**
 * GET /api/analytics/team-performance
 *
 * Эффективность и нагрузка команды (PLAT-05): сделки (сумма/конверсия/win-rate),
 * активные/просроченные задачи, активные проекты. По каждому пользователю.
 * Query params: period, pipelineId (optional).
 *
 * N+1-fix: вместо отдельных запросов на пользователя — batch-запросы по всем пользователям.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { parsePeriodToDateRange } from '@/lib/periods'
import { getSession } from '@/lib/auth/session'

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
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // RBAC-fix: эффективность команды — только директор (раскрывает данные всех сотрудников).
    if (!session.roleCodes.includes('director')) {
      return NextResponse.json({ error: 'Forbidden', message: 'Только директор видит аналитику команды' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') ?? 'all'
    const pipelineId = searchParams.get('pipelineId')

    const range = parsePeriodToDateRange(period)

    const users = await prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true, email: true },
    })
    const userIds = users.map((u) => u.id)

    // Все стадии для определения won/lost/conversion.
    const stages = await prisma.dealStage.findMany({
      where: pipelineId ? { pipelineId } : {},
      orderBy: { order: 'asc' },
    })
    const wonStageIds = stages.filter((s) => s.isWonStage).map((s) => s.id)
    const lostStageIds = stages.filter((s) => s.isLostStage).map((s) => s.id)
    const firstStage = stages[0]
    const lastStageId = stages.length > 0 ? stages[stages.length - 1].id : null

    // ── Batch 1: все сделки всех пользователей ──
    const dealWhere: Record<string, unknown> = { managerId: { in: userIds } }
    if (pipelineId) dealWhere.pipelineId = pipelineId
    if (range) dealWhere.createdAt = { gte: range.start, lte: range.end }
    const allDeals = await prisma.deal.findMany({
      where: dealWhere,
      select: { id: true, amount: true, stageId: true, managerId: true },
    })

    // ── Batch 2: активные задачи всех пользователей ──
    const now = new Date()
    const allTasks = await prisma.task.findMany({
      where: {
        assigneeId: { in: userIds },
        deletedAt: null,
        status: { notIn: ['done', 'cancelled', 'failed'] },
      },
      select: { id: true, assigneeId: true, dueDate: true },
    })

    // ── Batch 3: активные проекты всех пользователей ──
    const allProjects = await prisma.project.findMany({
      where: {
        managerId: { in: userIds },
        deletedAt: null,
        status: { notIn: ['completed', 'closed'] },
      },
      select: { id: true, managerId: true },
    })

    // ── Batch 4: взаимодействия всех пользователей ──
    const allInteractions = await prisma.interaction.findMany({
      where: {
        authorId: { in: userIds },
        ...(range ? { createdAt: { gte: range.start, lte: range.end } } : {}),
      },
      select: { id: true, authorId: true },
    })

    // ── Build per-user results from batched data ──
    // Pre-group data by user for O(1) lookup.
    const dealsByUser = new Map<string, typeof allDeals>()
    const tasksByUser = new Map<string, typeof allTasks>()
    const projectsByUser = new Map<string, typeof allProjects>()
    const interactionsByUser = new Map<string, typeof allInteractions>()

    for (const d of allDeals) {
      if (!d.managerId) continue
      const arr = dealsByUser.get(d.managerId) ?? []
      arr.push(d)
      dealsByUser.set(d.managerId, arr)
    }
    for (const t of allTasks) {
      if (!t.assigneeId) continue
      const arr = tasksByUser.get(t.assigneeId) ?? []
      arr.push(t)
      tasksByUser.set(t.assigneeId, arr)
    }
    for (const p of allProjects) {
      if (!p.managerId) continue
      const arr = projectsByUser.get(p.managerId) ?? []
      arr.push(p)
      projectsByUser.set(p.managerId, arr)
    }
    for (const i of allInteractions) {
      if (!i.authorId) continue
      const arr = interactionsByUser.get(i.authorId) ?? []
      arr.push(i)
      interactionsByUser.set(i.authorId, arr)
    }

    const performance = users.map((user): UserPerf | null => {
      const deals = dealsByUser.get(user.id) ?? []
      const tasks = tasksByUser.get(user.id) ?? []
      const projects = projectsByUser.get(user.id) ?? []
      const interactions = interactionsByUser.get(user.id) ?? []

      const activeTaskCount = tasks.length
      const overdueTaskCount = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now).length
      const activeProjectCount = projects.length
      const interactionCount = interactions.length

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
      const decided = wonCount + lostCount
      const winRate = decided > 0 ? Math.round((wonCount / decided) * 100) : 0

      // Конверсия: сделки в последней стадии / всего.
      const dealsInLast = lastStageId ? deals.filter((d) => d.stageId === lastStageId).length : 0
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
