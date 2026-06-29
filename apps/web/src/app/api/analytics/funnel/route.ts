/**
 * GET /api/analytics/funnel
 *
 * Sales funnel analytics: deal counts, sums, and conversion rates per pipeline stage.
 * Query params: pipelineId (optional), period (optional: "3m", "6m", "12m", "all")
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db/prisma'
import { parsePeriodToDateRange } from '../../../../lib/periods'
import { LOSS_REASONS } from '../../../../lib/loss-reasons'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const pipelineId = searchParams.get('pipelineId')
    const period = searchParams.get('period') ?? 'all'

    // Parse period to date filter (через общий util).
    const range = parsePeriodToDateRange(period)
    const dateFrom = range?.start

    // Fetch pipeline stages with deal counts
    const stages = await prisma.dealStage.findMany({
      where: pipelineId ? { pipelineId } : {},
      include: {
        Deal: {
          where: range ? { createdAt: { gte: range.start, lte: range.end } } : {},
          select: { id: true, amount: true, createdAt: true },
        },
      },
      orderBy: { order: 'asc' },
    })

    // Build funnel data
    const funnelData = stages.map((stage, index) => {
      const dealCount = stage.Deal.length
      const totalAmount = stage.Deal.reduce((sum, d) => sum + Number(d.amount ?? 0), 0)
      const avgAmount = dealCount > 0 ? totalAmount / dealCount : 0

      // Conversion rate: deals in this stage / deals in first stage
      const firstStageCount = stages[0]?.Deal.length ?? 0
      const conversionRate = firstStageCount > 0
        ? Math.round((dealCount / firstStageCount) * 100)
        : 0

      // Conversion to next stage (if not last)
      const nextStageCount = index < stages.length - 1
        ? stages[index + 1]?.Deal.length ?? 0
        : 0
      const stageToStageConversion = dealCount > 0
        ? Math.round((nextStageCount / dealCount) * 100)
        : 0

      return {
        stageId: stage.id,
        stageName: stage.name,
        order: stage.order,
        dealCount,
        totalAmount,
        avgAmount,
        conversionRate,
        stageToStageConversion: index < stages.length - 1 ? stageToStageConversion : null,
      }
    })

    // Totals
    const totalDeals = funnelData.reduce((s, f) => s + f.dealCount, 0)
    const totalAmount = funnelData.reduce((s, f) => s + f.totalAmount, 0)
    const overallConversion = stages[0]?.Deal.length > 0 && stages.length > 0
      ? Math.round(((funnelData[funnelData.length - 1]?.dealCount ?? 0) / stages[0].Deal.length) * 100)
      : 0

    // PLAT-03: разбивка причин отказов. Сделки на lost-стадиях, сгруппированные
    // по lossReason через словарь LOSS_REASONS.
    const lostStageIds = stages.filter((s) => s.isLostStage).map((s) => s.id)
    let lossReasonBreakdown: Array<{ reason: string; label: string; count: number; amount: number }> = []
    let totalLost = 0
    if (lostStageIds.length > 0) {
      const lostDeals = await prisma.deal.findMany({
        where: {
          stageId: { in: lostStageIds },
          deletedAt: null,
          ...(range ? { createdAt: { gte: range.start, lte: range.end } } : {}),
        },
        select: { amount: true, lossReason: true },
      })
      totalLost = lostDeals.length
      const byReason = new Map<string, { count: number; amount: number }>()
      for (const d of lostDeals) {
        const key = d.lossReason ?? 'unknown'
        const e = byReason.get(key) ?? { count: 0, amount: 0 }
        e.count += 1
        e.amount += Number(d.amount ?? 0)
        byReason.set(key, e)
      }
      lossReasonBreakdown = LOSS_REASONS
        .map((r) => {
          const e = byReason.get(r.code)
          return e ? { reason: r.code, label: r.label, count: e.count, amount: e.amount } : null
        })
        .filter((x): x is { reason: string; label: string; count: number; amount: number } => x !== null)
        .sort((a, b) => b.count - a.count)
      // Неизвестные причины (если есть).
      const unknown = byReason.get('unknown')
      if (unknown) {
        lossReasonBreakdown.push({ reason: 'unknown', label: 'Не указана', count: unknown.count, amount: unknown.amount })
      }
    }

    return NextResponse.json({
      data: {
        stages: funnelData,
        summary: {
          totalDeals,
          totalAmount,
          overallConversion,
          firstStage: stages[0]?.name ?? 'N/A',
          lastStage: stages[stages.length - 1]?.name ?? 'N/A',
          pipelineName: pipelineId ? (await getPipelineName(pipelineId)) : 'All Pipelines',
          totalLost,
        },
        lossReasonBreakdown,
      },
    })
  } catch (error) {
    console.error('Failed to compute funnel:', error)
    return NextResponse.json(
      { error: 'Failed to compute funnel', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function getPipelineName(id: string): Promise<string> {
  const p = await prisma.pipeline.findUnique({ where: { id }, select: { name: true } })
  return p?.name ?? id
}
