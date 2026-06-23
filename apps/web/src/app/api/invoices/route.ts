/**
 * Invoice Collection API (S04 manual MVP)
 *
 * - GET  /api/invoices?projectId=&supplierId=&status=  → list with filters
 * - POST /api/invoices                                  → create (manual upload, PROC-27)
 */

import { NextRequest, NextResponse } from 'next/server'
import { invoices } from '../../../lib/db/invoices'
import type { InvoiceCreateInput } from '../../../lib/db/invoices'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sp = request.nextUrl.searchParams
    const data = await invoices.findMany({
      projectId: sp.get('projectId') ?? undefined,
      supplierId: sp.get('supplierId') ?? undefined,
      status: sp.get('status') ?? undefined,
    })
    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Failed to list invoices:', error)
    return NextResponse.json(
      { error: 'Failed to list invoices', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    if (!body.projectId || !body.supplierId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'projectId and supplierId are required' },
        { status: 400 }
      )
    }
    const createData: InvoiceCreateInput = {
      projectId: body.projectId,
      supplierId: body.supplierId,
      number: body.number,
      invoiceNumber: body.invoiceNumber,
      totalAmount: body.totalAmount,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      notes: body.notes,
      sourceFileId: body.sourceFileId,
      items: body.items,
    }
    const created = await invoices.create(createData)
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    return mapRepoError(error, 'create invoice')
  }
}

function mapRepoError(error: unknown, action: string): NextResponse {
  const status = (error as { statusCode?: number }).statusCode
  const message = error instanceof Error ? error.message : 'Unknown error'
  if (status === 400 || status === 404 || status === 409) {
    const label = status === 404 ? 'Not found' : status === 409 ? 'Conflict' : 'Validation failed'
    return NextResponse.json({ error: label, message }, { status })
  }
  console.error(`Failed to ${action}:`, error)
  return NextResponse.json({ error: `Failed to ${action}`, message }, { status: 500 })
}
