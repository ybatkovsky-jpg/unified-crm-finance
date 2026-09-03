/**
 * Project Payment stage API (FIN-01)
 *
 * PATCH  /api/project-payments/[id] — изменить план этапа (% или фиксированная сумма)
 * DELETE /api/project-payments/[id] — удалить этап
 */

import { NextRequest, NextResponse } from 'next/server';
import { projectPayments } from '@/lib/db/project-payments';
import { getSession } from '@/lib/auth/session';
import { requireSectionWrite } from '@/lib/auth/permissions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getSession();
    const denied = requireSectionWrite(session, 'finance');
    if (denied) return denied;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const updated = await projectPayments.update(id, {
      paymentType: body.paymentType,
      plannedPercent: typeof body.plannedPercent === 'number' ? body.plannedPercent : undefined,
      plannedAmount: typeof body.plannedAmount === 'number' ? body.plannedAmount : undefined,
      dueDate: body.dueDate,
      notes: body.notes,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to update project payment:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to update project payment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getSession();
    const denied = requireSectionWrite(session, 'finance');
    if (denied) return denied;

    const { id } = await params;
    await projectPayments.delete(id);
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error('Failed to delete project payment:', error);
    return NextResponse.json(
      { error: 'Failed to delete project payment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
