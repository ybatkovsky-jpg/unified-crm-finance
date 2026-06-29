/**
 * Designer Bonus Mark Paid API (PROJ-13)
 *
 * PATCH /api/designer-bonuses/[id]/mark-paid — отметить бонус выплаченным.
 */

import { NextRequest, NextResponse } from 'next/server';
import { designerBonuses } from '@/lib/db/designer-bonus';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    // FIN-06 guard: по умолчанию бонус нельзя выплатить до всех денег клиента.
    // overrideUnmet=true позволяет принудительную выплату (нестандартные ситуации).
    const body = await request.json().catch(() => ({}));
    const overrideUnmet = body.overrideUnmet === true;

    const paid = await designerBonuses.markPaid(id, overrideUnmet);
    const data = await designerBonuses.findById(paid.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to mark designer bonus as paid:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to mark designer bonus as paid', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
