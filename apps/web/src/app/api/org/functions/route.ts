/**
 * Org Functions API — PLAT-06.
 * - GET  /api/org/functions → список функций с отделом и назначениями
 * - POST /api/org/functions → создать функцию в отделе (director only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { org } from '@/lib/db/org'
import { getSession } from '@/lib/auth/session'
import { isAdminOrDirector } from '@/lib/auth/permissions'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await org.findFunctions()
    return NextResponse.json({ data, count: data.length })
  } catch (error) {
    console.error('Failed to fetch functions:', error)
    return NextResponse.json({ error: 'Failed to fetch functions' }, { status: 500 })
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
    const fn = await org.createFunction({
      departmentId: body.departmentId,
      name: body.name,
      description: body.description ?? null,
    })
    return NextResponse.json({ data: fn }, { status: 201 })
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: 'Validation failed', message: error.message }, { status: error.statusCode })
    }
    console.error('Failed to create function:', error)
    return NextResponse.json({ error: 'Failed to create function' }, { status: 500 })
  }
}
