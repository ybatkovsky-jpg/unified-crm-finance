/**
 * Single Invoice API
 *
 * - GET    /api/invoices/[id]   → invoice + supplier + project + items (with BOMItem)
 * - PATCH  /api/invoices/[id]   → update metadata
 * - DELETE /api/invoices/[id]   → delete (cascades items)
 */

import { NextRequest, NextResponse } from 'next/server'
import { invoices } from '../../../../lib/db/invoices'
import { getSession } from '@/lib/auth/session'
import { canModify } from '@/lib/auth/permissions'
import { getProjectManagerId } from '@/lib/db/projects'

interface RouteParams {
  params: Promise<{ id: string }>
}

function mapRepoError(error: unknown, action: string): NextResponse {
  const status = (error as { statusCode?: number }).statusCode
  const message = error instanceof Error ? error.message : 'Unknown error'
  if (status === 400 || status === 404) {
    return NextResponse.json(
      { error: status === 404 ? 'Not found' : 'Validation failed', message },
      { status }
    )
  }
  console.error(`Failed to ${action}:`, error)
  return NextResponse.json({ error: `Failed to ${action}`, message }, { status: 500 })
}

export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const result = await invoices.findById(id, true)
    if (!result) {
      return NextResponse.json({ error: 'Not found', message: `Invoice ${id} not found` }, { status: 404 })
    }
    return NextResponse.json({ data: result })
  } catch (error) {
    return mapRepoError(error, 'fetch invoice')
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const body = await request.json()
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await invoices.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Invoice not found' }, { status: 404 })
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const updated = await invoices.update(id, body)
    return NextResponse.json({ data: updated })
  } catch (error) {
    return mapRepoError(error, 'update invoice')
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Validation failed', message: 'id is required' }, { status: 400 })
    }
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await invoices.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found', message: 'Invoice not found' }, { status: 404 })
    const managerId = existing.projectId ? await getProjectManagerId(existing.projectId) : null
    if (!canModify(session, managerId === session.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const deleted = await invoices.delete(id)
    return NextResponse.json({ data: deleted, message: 'Invoice deleted' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Not found', message: 'Invoice not found' }, { status: 404 })
    }
    console.error('Failed to delete invoice:', error)
    return NextResponse.json({ error: 'Failed to delete invoice', message }, { status: 500 })
  }
}
