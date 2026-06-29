/**
 * GET /api/analytics/team-performance
 *
 * Manager performance metrics: deal counts, sums, conversion, avg cycle.
 * Query params: period, pipelineId (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') ?? 'all'
    const pipelineId = searchParams.get('pipelineId')

    let dateFrom: Date | undefined
    const now = new Date()
    switch (period) {
      case '3m': dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1); break
      case '6m': dateFrom = new Date(now.getFullYear(), now.getMonth() - 6, 1); break
      case '12m': dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), 1); break
    }

    // Get users who have deals
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    })

    // Get all deal stages for conversion tracking
    const stages = await prisma.dealStage.findMany({
      where: pipelineId ? { pipelineId } : {},
      orderBy: { order: 'asc' },
    })
    const firstStage = stages[0]
    const lastStage = stages[stages.length - 1]

    // Build performance per user
    const performance = await Promise.all(
      users.map(async (user) => {
        const dealWhere: Record<string, unknown> = { managerId: user.id }
        if (pipelineId) dealWhere.pipelineId = pipelineId
        if (dateFrom) dealWhere.createdAt = { gte: dateFrom }

        const deals = await prisma.deal.findMany({
          where: dealWhere,
          select: { id: true, amount: true, createdAt: true, stageId: true },
        })

        if (deals.length === 0) return null

        const totalAmount = deals.reduce((s, d) => s + Number(d.amount ?? 0), 0)
        const avgAmount = totalAmount / deals.length

        // Conversion: deals reaching last stage / total deals
        const dealsInFirst = firstStage ? deals.filter((d) => d.stageId === firstStage.id).length : 0
        const dealsInLast = lastStage ? deals.filter((d) => d.stageId === lastStage.id).length : 0
        const conversion = deals.length > 0 ? Math.round((dealsInLast / deals.length) * 100) : 0

        // Interaction count
        const interactionCount = await prisma.interaction.count({
          where: {
            authorId: user.id,
            ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
          },
        })

        return {
          userId: user.id,
          userName: user.name ?? user.email,
          dealCount: deals.length,
          totalAmount,
          avgAmount,
          conversion,
          interactionCount,
        }
      })
    )

    const filtered = performance
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.totalAmount - a.totalAmount)

    const totalDeals = filtered.reduce((s, p) => s + p.dealCount, 0)
    const totalAmount = filtered.reduce((s, p) => s + p.totalAmount, 0)
    const avgConversion = filtered.length > 0
      ? Math.round(filtered.reduce((s, p) => s + p.conversion, 0) / filtered.length)
      : 0

    return NextResponse.json({
      data: {
        managers: filtered,
        summary: {
          totalDeals,
          totalAmount,
          avgConversion,
          managerCount: filtered.length,
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
