/**
 * BOM Coverage Batch API (PROJ-07)
 *
 * GET /api/bom/coverage-map?projectIds=a,b,c — покрытие спецификациями для списка
 * проектов в ОДНОМ запросе (вместо N+1 по одному BOM на проект).
 *
 * Возвращает карту: projectId → { total, covered, bomStatus }.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sp = request.nextUrl.searchParams
    const projectIds = (sp.get('projectIds') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (projectIds.length === 0) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'projectIds query parameter is required' },
        { status: 400 }
      )
    }

    const boms = await prisma.bOM.findMany({
      where: { projectId: { in: projectIds } },
      select: { projectId: true, status: true, BOMItem: { select: { id: true } } },
    })

    const map: Record<string, { total: number; covered: number; bomStatus: string }> = {}
    for (const b of boms) {
      const items = b.BOMItem.length
      map[b.projectId] = {
        total: items,
        covered: b.status === 'locked' ? items : 0,
        bomStatus: b.status,
      }
    }

    return NextResponse.json({ data: map })
  } catch (error) {
    console.error('Failed to fetch BOM coverage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch BOM coverage', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
