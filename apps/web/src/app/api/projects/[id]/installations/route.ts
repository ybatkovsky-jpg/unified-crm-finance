/**
 * Installation Collection API (PROJ-10)
 *
 * GET  /api/projects/[id]/installations — list installations for project
 * POST /api/projects/[id]/installations — create new installation entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { installations } from '@/lib/db/installation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    const data = await installations.findByProject(projectId);
    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error('Failed to list installations:', error);
    return NextResponse.json(
      { error: 'Failed to list installations', message: error instanceof Error ? error.message : 'Unknown error' },
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
    const body = await request.json();

    const created = await installations.create({
      projectId,
      plannedStartDate: body.plannedStartDate,
      advancePercent: body.advancePercent,
      advanceAmount: body.advanceAmount,
      cost: body.cost,
      notes: body.notes,
    });

    // Fetch with workers for response
    const withWorkers = await installations.findById(created.id);
    return NextResponse.json({ data: withWorkers }, { status: 201 });
  } catch (error) {
    console.error('Failed to create installation:', error);
    return NextResponse.json(
      { error: 'Failed to create installation', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
