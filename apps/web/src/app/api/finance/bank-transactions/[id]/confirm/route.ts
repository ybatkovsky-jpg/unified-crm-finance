/**
 * Bank Transaction Confirm API (FIN-02)
 *
 * POST /api/finance/bank-transactions/[id]/confirm — ручное подтверждение сопоставления.
 *
 * Тело: { invoiceId?, projectId?, paymentMethod? }
 * Создаёт Transaction(income, source=import) и связывает с банком/счётом/проектом.
 */

import { NextRequest, NextResponse } from 'next/server';
import { confirmMatch } from '@/lib/finance/matching-engine';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const result = await confirmMatch(id, {
      invoiceId: body.invoiceId,
      projectId: body.projectId,
      paymentMethod: body.paymentMethod,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('Failed to confirm bank transaction match:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to confirm match', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
