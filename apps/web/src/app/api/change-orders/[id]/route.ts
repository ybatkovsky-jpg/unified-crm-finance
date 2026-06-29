/**
 * Single ChangeOrder API (PROJ-11)
 *
 * GET    /api/change-orders/[id] — fetch change order
 * PATCH  /api/change-orders/[id] — update change order
 * DELETE /api/change-orders/[id] — delete change order
 */

import { NextRequest, NextResponse } from 'next/server';
import { changeOrders } from '@/lib/db/change-orders';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const result = await changeOrders.findById(id);
    if (!result) {
      return NextResponse.json(
        { error: 'Not found', message: `ChangeOrder ${id} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Failed to fetch change order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch change order', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await changeOrders.update(id, {
      title: body.title,
      description: body.description,
      amount: body.amount,
      contractId: body.contractId,
      notes: body.notes,
    });

    // Handle status transition if requested
    if (body.status && body.status !== updated.status) {
      const transitioned = await changeOrders.transitionStatus(id, body.status);
      const result = await changeOrders.findById(transitioned.id);
      return NextResponse.json({ data: result });
    }

    const result = await changeOrders.findById(updated.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Invalid status')) {
      return NextResponse.json(
        { error: 'Validation failed', message },
        { status: 400 }
      );
    }
    console.error('Failed to update change order:', error);
    return NextResponse.json(
      { error: 'Failed to update change order', message },
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
    await changeOrders.delete(id);
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    console.error('Failed to delete change order:', error);
    return NextResponse.json(
      { error: 'Failed to delete change order', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
