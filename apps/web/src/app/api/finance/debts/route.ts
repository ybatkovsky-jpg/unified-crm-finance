/**
 * Finance Debts API (FIN-05)
 *
 * GET /api/finance/debts — дебиторская и кредиторская задолженность.
 */

import { NextRequest, NextResponse } from 'next/server';
import { debts } from '@/lib/db/debts';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await debts.getSummary();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to get debts summary:', error);
    return NextResponse.json(
      { error: 'Failed to get debts summary', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
