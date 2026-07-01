/**
 * Org Department by-id API — PLAT-06.
 * - PATCH /api/org/departments/[id] → переименовать/описание (director only)
 * - DELETE /api/org/departments/[id] → мягко удалить (director only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { org } from '@/lib/db/org'
import { getSession } from '@/lib/auth/session'
import { isAdminOrDirector } from '@/lib/auth/permissions'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdminOrDirector(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params
    const body = await request.json()
    const dept = await org.updateDepartment(id, {
      name: body.name,
      description: body.description,
    })
    return NextResponse.json({ data: dept })
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: 'Validation failed', message: error.message }, { status: error.statusCode })
    }
    console.error('Failed to update department:', error)
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdminOrDirector(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { id } = await params
    await org.deleteDepartment(id)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: 'Validation failed', message: error.message }, { status: error.statusCode })
    }
    console.error('Failed to delete department:', error)
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 })
  }
}
