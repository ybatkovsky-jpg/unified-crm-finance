/**
 * Org Task Template by-id API — PLAT-06.
 * - PATCH /api/org/templates/[id] → изменить шаблон (director only)
 * - DELETE /api/org/templates/[id] → мягко удалить (director only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { taskTemplates } from '@/lib/db/task-templates'
import { getSession } from '@/lib/auth/session'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.roleCodes.includes('director')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params
    const body = await request.json()
    const template = await taskTemplates.update(id, {
      functionId: body.functionId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      rrule: body.rrule,
      dtStart: body.dtStart ? new Date(body.dtStart) : undefined,
      dtEnd: body.dtEnd !== undefined ? (body.dtEnd ? new Date(body.dtEnd) : null) : undefined,
      isActive: body.isActive,
      assigneeStrategy: body.assigneeStrategy,
      fixedAssigneeId: body.fixedAssigneeId,
    })
    return NextResponse.json({ data: template })
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: 'Validation failed', message: error.message }, { status: error.statusCode })
    }
    console.error('Failed to update template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.roleCodes.includes('director')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params
    await taskTemplates.softDelete(id)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: 'Validation failed', message: error.message }, { status: error.statusCode })
    }
    console.error('Failed to delete template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
