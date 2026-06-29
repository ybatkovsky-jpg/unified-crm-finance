/**
 * Bank Statement Auto-Match API (FIN-02)
 *
 * POST /api/finance/statements/[id]/match — запустить авто-сверку транзакций.
 *
 * Возвращает сводку: сколько сопоставлено, сколько требует ручного разбора.
 */

import { NextRequest, NextResponse } from 'next/server';
import { matchBankTransactions } from '@/lib/finance/matching-engine';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const summary = await matchBankTransactions(id);
    return NextResponse.json({ data: summary });
  } catch (error) {
    console.error('Failed to match bank statement:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to match bank statement', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
