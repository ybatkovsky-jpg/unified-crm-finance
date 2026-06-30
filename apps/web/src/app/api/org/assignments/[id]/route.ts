/**
 * Org Assignment by-id API — PLAT-06.
 * - DELETE /api/org/assignments/[id] → снять назначение (director only)
 */
import { NextRequest, NextResponse } from 'next/server'
import { org } from '@/lib/db/org'
import { getSession } from '@/lib/auth/session'

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
    await org.unassign(id)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: 'Validation failed', message: error.message }, { status: error.statusCode })
    }
    console.error('Failed to unassign:', error)
    return NextResponse.json({ error: 'Failed to unassign' }, { status: 500 })
  }
}
