/**
 * Bank Statements List API (FIN-02)
 *
 * GET /api/finance/statements — список выписок
 */

import { NextRequest, NextResponse } from 'next/server';
import { bankStatements } from '@/lib/db/bank-statements';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const data = await bankStatements.list();
    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error('Failed to list bank statements:', error);
    return NextResponse.json(
      { error: 'Failed to list bank statements', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
