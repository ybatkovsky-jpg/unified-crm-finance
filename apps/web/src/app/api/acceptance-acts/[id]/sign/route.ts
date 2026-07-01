/**
 * Acceptance Act Sign API (PROJ-12)
 *
 * PATCH /api/acceptance-acts/[id]/sign — подписать акт (draft → signed).
 *
 * Тело: { signedById, signerType?, signMethod? }
 * signerType, если не указан, выводится из типа контрагента проекта:
 *   физлицо → individual (монтажник); юрлицо → legal (менеджер).
 */

import { NextRequest, NextResponse } from 'next/server';
import { acceptanceActs } from '@/lib/db/acceptance-act';
import type { AcceptanceSignerType, AcceptanceSignMethod } from '@/lib/db/acceptance-act';
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
    const body = await request.json();

    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const existing = await acceptanceActs.findById(id);
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Acceptance act not found' }, { status: 404 });
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null;
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!body.signedById) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'signedById is required' },
        { status: 400 }
      );
    }

    const signed = await acceptanceActs.sign(id, {
      signedById: body.signedById,
      signerType: body.signerType as AcceptanceSignerType | undefined,
      signMethod: body.signMethod as AcceptanceSignMethod | undefined,
    });

    const data = await acceptanceActs.findById(signed.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to sign acceptance act:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to sign acceptance act', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
