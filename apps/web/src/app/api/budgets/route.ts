/**
 * Budgets Collection API Endpoint
 *
 * CRUD API for Budget model:
 * - GET: List budgets with optional projectId, categoryId, period filters
 *        (если указан только period без projectId — возвращает орг-бюджеты)
 * - POST: Create a new budget with validation (projectId опционален для орг-бюджета)
 *
 * GET /api/budgets
 * POST /api/budgets
 */

import { NextRequest, NextResponse } from 'next/server'
import { budgets } from '../../../lib/db/budgets'

/**
 * GET /api/budgets
 *
 * Returns budgets with optional filters:
 * - projectId: filter by project
 * - categoryId: filter by category
 * - period: filter by period (e.g. "2026-01", "2026-Q1", "2026")
 * - org=1 (с period): только организационные бюджеты (projectId = null), ACCT-01/03
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const categoryId = searchParams.get('categoryId')
    const period = searchParams.get('period')
    const org = searchParams.get('org') === '1'

    // Organizational budgets (constant expenses, projectId = null).
    if (org && period) {
      const data = await budgets.findOrgByPeriod(period)
      const filteredData = categoryId
        ? data.filter((b) => b.categoryId === categoryId)
        : data
      return NextResponse.json({ data: filteredData, count: filteredData.length })
    }

    // If projectId is provided, use findByProject with filters
    if (projectId) {
      const data = await budgets.findByProject(projectId, {
        categoryId: categoryId ?? undefined,
        period: period ?? undefined,
      })
      return NextResponse.json({ data, count: data.length })
    }

    // If only period is provided, use findByPeriod
    if (period) {
      const data = await budgets.findByPeriod(period)
      // Filter by categoryId if also provided
      const filteredData = categoryId
        ? data.filter((b) => b.categoryId === categoryId)
        : data
      return NextResponse.json({ data: filteredData, count: filteredData.length })
    }

    // No filters — not supported (must specify at least projectId or period)
    return NextResponse.json(
      { error: 'Validation failed', message: 'At least projectId or period filter is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Failed to fetch budgets:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch budgets',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/budgets
 *
 * Creates a new budget. projectId опционален: если не задан — создаётся
 * организационный бюджет (постоянные расходы, ACCT-01/03).
 * Required fields: categoryId, amount, period.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    // categoryId, amount, period — обязательны. projectId — опционален (орг-бюджет).
    if (!body.categoryId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'categoryId is required' },
        { status: 400 }
      )
    }
    if (body.amount === undefined || body.amount === null) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'amount is required' },
        { status: 400 }
      )
    }
    if (!body.period) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'period is required' },
        { status: 400 }
      )
    }

    const createData = {
      projectId: body.projectId ?? null,
      categoryId: body.categoryId,
      amount: body.amount,
      period: body.period,
      note: body.note ?? null,
    }

    const newBudget = await budgets.create(createData)

    return NextResponse.json({ data: newBudget }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Validation errors → 400
    if (
      message.includes('not found') ||
      message.includes('already exists') ||
      message.includes('inactive')
    ) {
      return NextResponse.json(
        { error: 'Validation failed', message },
        { status: 400 }
      )
    }

    console.error('Failed to create budget:', error)
    return NextResponse.json(
      { error: 'Failed to create budget', message },
      { status: 500 }
    )
  }
}
