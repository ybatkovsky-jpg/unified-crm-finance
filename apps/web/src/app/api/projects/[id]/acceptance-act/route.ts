/**
 * Acceptance Act API (PROJ-12)
 *
 * GET  /api/projects/[id]/acceptance-act — получить акт проекта (или null)
 * POST /api/projects/[id]/acceptance-act — создать акт (идемпотентно: если есть — вернуть существующий)
 *
 * Тело POST: { signerType?, signMethod?, actFileId?, notes? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { acceptanceActs } from '@/lib/db/acceptance-act';
import type { AcceptanceSignerType, AcceptanceSignMethod } from '@/lib/db/acceptance-act';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    const data = await acceptanceActs.findByProject(projectId);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to get acceptance act:', error);
    return NextResponse.json(
      { error: 'Failed to get acceptance act', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    const body = await request.json().catch(() => ({}));

    const created = await acceptanceActs.create(projectId, {
      signerType: body.signerType as AcceptanceSignerType | undefined,
      signMethod: body.signMethod as AcceptanceSignMethod | undefined,
      actFileId: body.actFileId,
      notes: body.notes,
    });

    // Вернуть с отношениями.
    const data = await acceptanceActs.findById(created.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Failed to create acceptance act:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to create acceptance act', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
