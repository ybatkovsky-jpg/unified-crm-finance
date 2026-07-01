/**
 * Single CashFlowPayment API Endpoint
 *
 * CRUD for individual payment by ID:
 * - GET: Fetch single payment
 * - PATCH: Update payment
 * - DELETE: Delete payment
 *
 * GET /api/cashflow-payments/[id]
 * PATCH /api/cashflow-payments/[id]
 * DELETE /api/cashflow-payments/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { cashflowPayments } from '../../../../lib/db/cashflow-payments'
import type { CashFlowPaymentUpdateInput } from '../../../../lib/db/cashflow-payments'
import { getSession } from '@/lib/auth/session'
import { canModify } from '@/lib/auth/permissions'
import { getProjectManagerId } from '@/lib/db/projects'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })

    const payment = await cashflowPayments.findById(id)
    if (!payment) return NextResponse.json({ error: 'Not found', message: `Payment ${id} not found` }, { status: 404 })

    return NextResponse.json({ data: payment })
  } catch (error) {
    console.error('Failed to fetch payment:', error)
    return NextResponse.json({ error: 'Failed to fetch payment', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await cashflowPayments.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Payment not found' }, { status: 404 })
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: CashFlowPaymentUpdateInput = {}
    if (body.date !== undefined) updateData.date = new Date(body.date)
    if (body.amount !== undefined) updateData.amount = body.amount
    if (body.type !== undefined) updateData.type = body.type
    if (body.projectId !== undefined) updateData.projectId = body.projectId
    if (body.counterpartyId !== undefined) updateData.counterpartyId = body.counterpartyId
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null

    const updated = await cashflowPayments.update(id, updateData)
    return NextResponse.json({ data: updated }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('not found')) return NextResponse.json({ error: 'Not found', message }, { status: 404 })
    if (message.includes('Invalid status')) return NextResponse.json({ error: 'Validation failed', message }, { status: 400 })
    console.error('Failed to update payment:', error)
    return NextResponse.json({ error: 'Failed to update payment', message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await cashflowPayments.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Payment not found' }, { status: 404 })
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const deleted = await cashflowPayments.delete(id)
    return NextResponse.json({ data: deleted, message: 'Payment deleted successfully' }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('not found')) return NextResponse.json({ error: 'Not found', message }, { status: 404 })
    console.error('Failed to delete payment:', error)
    return NextResponse.json({ error: 'Failed to delete payment', message }, { status: 500 })
  }
}
