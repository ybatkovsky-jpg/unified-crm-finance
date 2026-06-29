/**
 * Designer Bonus API (минимальный след, PROJ-13; полная логика — FIN-06 Phase 8)
 *
 * GET /api/projects/[id]/designer-bonus — получить бонус проекта (или null)
 * PUT /api/projects/[id]/designer-bonus — создать/обновить бонус (upsert)
 *
 * Тело PUT: { designerId?, percent?, amount?, notes? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { designerBonuses } from '@/lib/db/designer-bonus';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    const data = await designerBonuses.findByProject(projectId);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to get designer bonus:', error);
    return NextResponse.json(
      { error: 'Failed to get designer bonus', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    const body = await request.json().catch(() => ({}));

    const upserted = await designerBonuses.upsert(projectId, {
      designerId: body.designerId,
      percent: typeof body.percent === 'number' ? body.percent : undefined,
      amount: typeof body.amount === 'number' ? body.amount : undefined,
      notes: body.notes,
    });

    const data = await designerBonuses.findById(upserted.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to upsert designer bonus:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to save designer bonus', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
