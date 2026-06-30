/**
 * Org Assignments API — PLAT-06.
 * - POST /api/org/assignments → назначить пользователя на функцию (director only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { org } from '@/lib/db/org'
import { getSession } from '@/lib/auth/session'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!session.roleCodes.includes('director')) {
      return NextResponse.json({ error: 'Forbidden', message: 'Только директор назначает людей на функции' }, { status: 403 })
    }

    const body = await request.json()
    const a = await org.assignUser({
      functionId: body.functionId,
      userId: body.userId,
      role: body.role,
    })
    return NextResponse.json({ data: a }, { status: 201 })
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: 'Validation failed', message: error.message }, { status: error.statusCode })
    }
    console.error('Failed to assign user:', error)
    return NextResponse.json({ error: 'Failed to assign user' }, { status: 500 })
  }
}
