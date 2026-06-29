/**
 * GET /api/analytics/funnel
 *
 * Sales funnel analytics: deal counts, sums, and conversion rates per pipeline stage.
 * Query params: pipelineId (optional), period (optional: "3m", "6m", "12m", "all")
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const pipelineId = searchParams.get('pipelineId')
    const period = searchParams.get('period') ?? 'all'

    // Parse period to date filter
    let dateFrom: Date | undefined
    const now = new Date()
    switch (period) {
      case '3m': dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1); break
      case '6m': dateFrom = new Date(now.getFullYear(), now.getMonth() - 6, 1); break
      case '12m': dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), 1); break
      // 'all' — no date filter
    }

    const where: Record<string, unknown> = {}
    if (pipelineId) where.pipelineId = pipelineId
    if (dateFrom) where.createdAt = { gte: dateFrom }

    // Fetch pipeline stages with deal counts
    const stages = await prisma.dealStage.findMany({
      where: pipelineId ? { pipelineId } : {},
      include: {
        Deal: {
          where: dateFrom ? { createdAt: { gte: dateFrom } } : {},
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
        },
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
