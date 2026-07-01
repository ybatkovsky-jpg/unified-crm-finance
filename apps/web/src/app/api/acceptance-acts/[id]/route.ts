/**
 * Acceptance Act Item API (PROJ-12)
 *
 * PATCH /api/acceptance-acts/[id] — обновить акт (метод подписи, файл, заметки, статус)
 */

import { NextRequest, NextResponse } from 'next/server';
import { acceptanceActs } from '@/lib/db/acceptance-act';
import type { AcceptanceSignMethod, AcceptanceActStatus } from '@/lib/db/acceptance-act';
import { getSession } from '@/lib/auth/session';
import { canModify } from '@/lib/auth/permissions';
import { getProjectManagerId } from '@/lib/db/projects';

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

    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const existing = await acceptanceActs.findById(id);
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Acceptance act not found' }, { status: 404 });
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null;
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const existing = await acceptanceActs.findById(id);
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Acceptance act not found' }, { status: 404 });
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null;
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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
