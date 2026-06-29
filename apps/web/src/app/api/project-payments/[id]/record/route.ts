/**
 * Project Payment Record API (FIN-01)
 *
 * POST /api/project-payments/[id]/record — зафиксировать платёж по этапу.
 *
 * Тело: { amount, paymentMethod?, transactionDate?, description? }
 * Создаёт Transaction(income) и обновляет receivedAmount/status этапа.
 */

import { NextRequest, NextResponse } from 'next/server';
import { projectPayments } from '@/lib/db/project-payments';
import type { PaymentMethod } from '@/lib/db/project-payments';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'amount must be a positive number' },
        { status: 400 }
      );
    }

    const updated = await projectPayments.recordPayment(id, {
      amount: body.amount,
      paymentMethod: body.paymentMethod as PaymentMethod | undefined,
      transactionDate: body.transactionDate,
      description: body.description,
    });

    const data = await projectPayments.findById(updated.id);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to record project payment:', error);
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    return NextResponse.json(
      { error: 'Failed to record project payment', message: error instanceof Error ? error.message : 'Unknown error' },
      { status }
    );
  }
}
