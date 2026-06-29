/**
 * Transactions Collection API Endpoint
 *
 * CRUD API for Transaction model:
 * - GET: List transactions with optional filters
 * - POST: Create a new transaction with validation
 *
 * GET /api/transactions
 * POST /api/transactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { transactions } from '../../../lib/db/transactions'
import type { TransactionFilters } from '../../../lib/db/transactions'

/**
 * GET /api/transactions
 *
 * Returns transactions with optional filters:
 * - projectId, categoryId, counterpartyId, invoiceId
 * - type (income/expense), status (confirmed/pending), source (manual/import)
 * - dateFrom, dateTo (ISO date strings)
 * - includeDeleted (default: false)
 * - skip, take (pagination)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams

    const filters: TransactionFilters = {}

    const projectId = searchParams.get('projectId')
    const categoryId = searchParams.get('categoryId')
    const counterpartyId = searchParams.get('counterpartyId')
    const invoiceId = searchParams.get('invoiceId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const includeDeleted = searchParams.get('includeDeleted')
    const skip = searchParams.get('skip')
    const take = searchParams.get('take')

    if (projectId) filters.projectId = projectId
    if (categoryId) filters.categoryId = categoryId
    if (counterpartyId) filters.counterpartyId = counterpartyId
    if (invoiceId) filters.invoiceId = invoiceId
    if (type) filters.type = type
    if (status) filters.status = status
    if (source) filters.source = source
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo
    if (includeDeleted === 'true') filters.includeDeleted = true

    const data = await transactions.findWithFilters(
      filters,
      skip ? parseInt(skip) : undefined,
      take ? parseInt(take) : undefined
    )

    const count = await transactions.countWithFilters(filters)

    return NextResponse.json({ data, count })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/transactions
 *
 * Creates a new transaction.
 * Required fields: categoryId, date, amount, type (income/expense).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.categoryId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'categoryId is required' },
        { status: 400 }
      )
    }
    if (!body.date) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'date is required' },
        { status: 400 }
      )
    }
    if (body.amount === undefined || body.amount === null) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'amount is required' },
        { status: 400 }
      )
    }
    if (!body.type || (body.type !== 'income' && body.type !== 'expense')) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'type must be "income" or "expense"' },
        { status: 400 }
      )
    }

    const createData = {
      categoryId: body.categoryId,
      date: new Date(body.date),
      amount: body.amount,
      type: body.type,
      projectId: body.projectId ?? null,
      counterpartyId: body.counterpartyId ?? null,
      invoiceId: body.invoiceId ?? null,
      description: body.description ?? null,
      source: body.source ?? 'manual',
      status: body.status ?? 'confirmed',
      paymentMethod: body.paymentMethod ?? null,
      paymentType: body.paymentType ?? null,
      createdBy: body.createdBy ?? 'system',
    }

    const newTransaction = await transactions.create(createData)

    return NextResponse.json({ data: newTransaction }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found') || message.includes('inactive')) {
      return NextResponse.json(
        { error: 'Validation failed', message },
        { status: 400 }
      )
    }

    console.error('Failed to create transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction', message },
      { status: 500 }
    )
  }
}
