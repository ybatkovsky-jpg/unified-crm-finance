/**
 * Single Installation API (PROJ-10)
 *
 * GET    /api/installations/[id] — fetch installation with workers
 * PATCH  /api/installations/[id] — update installation metadata
 * DELETE /api/installations/[id] — delete installation
 */

import { NextRequest, NextResponse } from 'next/server';
import { installations } from '@/lib/db/installation';
import { getSession } from '@/lib/auth/session';
import { canModify } from '@/lib/auth/permissions';
import { getProjectManagerId } from '@/lib/db/projects';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const result = await installations.findById(id);
    if (!result) {
      return NextResponse.json(
        { error: 'Not found', message: `Installation ${id} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch installation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installation', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
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

    const updated = await installations.update(id, {
      plannedStartDate: body.plannedStartDate,
      advancePercent: body.advancePercent,
      advanceAmount: body.advanceAmount,
      cost: body.cost,
      notes: body.notes,
    });

    const result = await installations.findById(updated.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to update installation:', error);
    return NextResponse.json(
      { error: 'Failed to update installation', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
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
    const existing = await installations.findById(id);
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Installation not found' }, { status: 404 });
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null;
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await installations.delete(id);
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error('Failed to delete installation:', error);
    return NextResponse.json(
      { error: 'Failed to delete installation', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
