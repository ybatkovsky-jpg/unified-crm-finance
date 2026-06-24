/**
 * CashFlow Payments Collection API Endpoint
 *
 * CRUD API for CashFlowPayment model:
 * - GET: List payments with optional filters
 * - POST: Create a new payment with validation
 *
 * GET /api/cashflow-payments
 * POST /api/cashflow-payments
 */

import { NextRequest, NextResponse } from 'next/server'
import { cashflowPayments } from '../../../lib/db/cashflow-payments'
import type { CashFlowPaymentFilters } from '../../../lib/db/cashflow-payments'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters: CashFlowPaymentFilters = {}

    const projectId = searchParams.get('projectId')
    const counterpartyId = searchParams.get('counterpartyId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const dueBefore = searchParams.get('dueBefore')
    const skip = searchParams.get('skip')
    const take = searchParams.get('take')

    if (projectId) filters.projectId = projectId
    if (counterpartyId) filters.counterpartyId = counterpartyId
    if (status) filters.status = status
    if (type) filters.type = type
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo
    if (dueBefore) filters.dueBefore = dueBefore

    const data = await cashflowPayments.findWithFilters(
      filters,
      skip ? parseInt(skip) : undefined,
      take ? parseInt(take) : undefined
    )
    const count = await cashflowPayments.countWithFilters(filters)

    return NextResponse.json({ data, count })
  } catch (error) {
    console.error('Failed to fetch cashflow payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    if (!body.date) {
      return NextResponse.json({ error: 'Validation failed', message: 'date is required' }, { status: 400 })
    }
    if (body.amount === undefined || body.amount === null) {
      return NextResponse.json({ error: 'Validation failed', message: 'amount is required' }, { status: 400 })
    }
    if (!body.type) {
      return NextResponse.json({ error: 'Validation failed', message: 'type is required' }, { status: 400 })
    }

    const createData = {
      date: new Date(body.date),
      amount: body.amount,
      type: body.type,
      projectId: body.projectId ?? null,
      counterpartyId: body.counterpartyId ?? null,
      invoiceId: body.invoiceId ?? null,
      description: body.description ?? null,
      status: body.status ?? 'planned',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    }

    const newPayment = await cashflowPayments.create(createData)
    return NextResponse.json({ data: newPayment }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('not found')) {
      return NextResponse.json({ error: 'Validation failed', message }, { status: 400 })
    }
    console.error('Failed to create cashflow payment:', error)
    return NextResponse.json({ error: 'Failed to create payment', message }, { status: 500 })
  }
}
