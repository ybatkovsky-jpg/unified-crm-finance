/**
 * Invoice Collection API (S04 manual MVP)
 *
 * - GET  /api/invoices?projectId=&supplierId=&status=  → list with filters
 * - POST /api/invoices                                  → create (manual upload, PROC-27)
 */

import { NextRequest, NextResponse } from 'next/server'
import { invoices } from '../../../lib/db/invoices'
import type { InvoiceCreateInput } from '../../../lib/db/invoices'
import { mapErrorToResponse } from '../../../lib/api/error-mapping'

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
    return mapErrorToResponse(error, 'list invoices')
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
    return mapErrorToResponse(error, 'create invoice')
  }
}
