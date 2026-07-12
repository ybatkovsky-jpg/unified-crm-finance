/**
 * Org Departments API — PLAT-06.
 * - GET  /api/org/departments → список отделов с функциями и назначениями
 * - POST /api/org/departments → создать отдел (director only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { org } from '@/lib/db/org'
import { getSession } from '@/lib/auth/session'
import { isAdminOrDirector } from '@/lib/auth/permissions'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await org.findDepartments()
    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Failed to fetch departments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch departments', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdminOrDirector(session)) {
      return NextResponse.json({ error: 'Forbidden', message: 'Только директор может редактировать орг-структуру' }, { status: 403 })
    }

    const body = await request.json()
    const dept = await org.createDepartment({
      name: body.name,
      description: body.description ?? null,
    })
    return NextResponse.json({ data: dept }, { status: 201 })
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: 'Validation failed', message: error.message }, { status: error.statusCode })
    }
    console.error('Failed to create department:', error)
    return NextResponse.json(
      { error: 'Failed to create department', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
