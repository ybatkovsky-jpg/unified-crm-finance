/**
 * Bank Statement Detail API (FIN-02)
 *
 * GET   /api/finance/statements/[id] — выписка с транзакциями
 * DELETE /api/finance/statements/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { bankStatements } from '@/lib/db/bank-statements';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const data = await bankStatements.findById(id);
    if (!data) {
      return NextResponse.json(
        { error: 'Not found', message: 'Bank statement not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to get bank statement:', error);
    return NextResponse.json(
      { error: 'Failed to get bank statement', message: error instanceof Error ? error.message : 'Unknown error' },
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
    await bankStatements.delete(id);
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error('Failed to delete bank statement:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to delete bank statement', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
