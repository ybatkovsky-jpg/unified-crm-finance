/**
 * Designer Debt Summary API (FIN-06)
 *
 * GET /api/finance/designer-debt — накопленный долг дизайнеров (невыплаченные бонусы).
 *
 * Query: ?designerId=... — долг одного дизайнера; без параметра — сводка по всем.
 */

import { NextRequest, NextResponse } from 'next/server';
import { designerBonuses } from '@/lib/db/designer-bonus';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const designerId = request.nextUrl.searchParams.get('designerId');

    if (designerId) {
      const data = await designerBonuses.getDesignerDebt(designerId);
      return NextResponse.json({ data });
    }

    const data = await designerBonuses.getDebtSummary();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to get designer debt summary:', error);
    return NextResponse.json(
      { error: 'Failed to get designer debt summary', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
