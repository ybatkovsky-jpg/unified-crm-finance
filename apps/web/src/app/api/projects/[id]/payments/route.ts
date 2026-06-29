/**
 * Project Payments API (FIN-01)
 *
 * GET  /api/projects/[id]/payments — список этапов оплаты (с авто-созданием 70/30 при отсутствии)
 * POST /api/projects/[id]/payments — создать этап оплаты
 */

import { NextRequest, NextResponse } from 'next/server';
import { projectPayments } from '@/lib/db/project-payments';
import type { ProjectPaymentType } from '@/lib/db/project-payments';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    // Авто-создать этапы 70/30, если их ещё нет (удобно для UI).
    const data = await projectPayments.ensureDefaultStages(projectId);
    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error('Failed to list project payments:', error);
    return NextResponse.json(
      { error: 'Failed to list project payments', message: error instanceof Error ? error.message : 'Unknown error' },
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

    const created = await projectPayments.create(projectId, {
      paymentType: body.paymentType as ProjectPaymentType,
      plannedPercent: typeof body.plannedPercent === 'number' ? body.plannedPercent : undefined,
      dueDate: body.dueDate,
      notes: body.notes,
    });

    const data = await projectPayments.findById(created.id);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Failed to create project payment:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to create project payment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
