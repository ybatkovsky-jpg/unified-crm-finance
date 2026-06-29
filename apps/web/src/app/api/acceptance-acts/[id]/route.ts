/**
 * Acceptance Act Item API (PROJ-12)
 *
 * PATCH /api/acceptance-acts/[id] — обновить акт (метод подписи, файл, заметки, статус)
 */

import { NextRequest, NextResponse } from 'next/server';
import { acceptanceActs } from '@/lib/db/acceptance-act';
import type { AcceptanceSignMethod, AcceptanceActStatus } from '@/lib/db/acceptance-act';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updated = await acceptanceActs.update(id, {
      signMethod: body.signMethod !== undefined ? (body.signMethod as AcceptanceSignMethod | null) : undefined,
      actFileId: body.actFileId !== undefined ? body.actFileId : undefined,
      notes: body.notes !== undefined ? body.notes : undefined,
      status: body.status as AcceptanceActStatus | undefined,
    });

    const data = await acceptanceActs.findById(updated.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to update acceptance act:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to update acceptance act', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await acceptanceActs.delete(id);
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error('Failed to delete acceptance act:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to delete acceptance act', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
