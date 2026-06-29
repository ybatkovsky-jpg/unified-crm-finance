/**
 * ChangeOrder Collection API (PROJ-11)
 *
 * GET  /api/projects/[id]/change-orders — list change orders for project
 * POST /api/projects/[id]/change-orders — create new change order
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
    const { id: projectId } = await params;
    const data = await changeOrders.findByProject(projectId);
    return NextResponse.json({ data, count: data.length });
  } catch (error) {
    console.error('Failed to list change orders:', error);
    return NextResponse.json(
      { error: 'Failed to list change orders', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    if (!body.title || body.amount === undefined) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'title and amount are required' },
        { status: 400 }
      );
    }

    const created = await changeOrders.create({
      projectId,
      contractId: body.contractId,
      title: body.title,
      description: body.description,
      amount: body.amount,
      notes: body.notes,
    });

    const result = await changeOrders.findById(created.id);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    console.error('Failed to create change order:', error);
    return NextResponse.json(
      { error: 'Failed to create change order', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
