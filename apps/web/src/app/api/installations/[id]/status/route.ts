/**
 * Installation Status Transition API (PROJ-10)
 *
 * PATCH /api/installations/[id]/status
 * Body: { status: "advance_paid" | "started" | "completed" | "cancelled" }
 *
 * Status machine: planned → advance_paid → started → completed (+ cancelled from any)
 */

import { NextRequest, NextResponse } from 'next/server';
import { installations } from '@/lib/db/installation';
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
    const existing = await installations.findById(id);
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Installation not found' }, { status: 404 });
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null;
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!body.status) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'status is required' },
        { status: 400 }
      );
    }

    const updated = await installations.transitionStatus(id, body.status);
    const result = await installations.findById(updated.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Invalid status') || message.includes('Invalid status transition')) {
      return NextResponse.json(
        { error: 'Validation failed', message },
        { status: 400 }
      );
    }
    console.error('Failed to update installation status:', error);
    return NextResponse.json(
      { error: 'Failed to update status', message },
      { status: 500 }
    );
  }
}
