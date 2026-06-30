/**
 * Org Template preview API — PLAT-06.
 * - POST /api/org/templates/preview → предпросмотр следующих N дат RRULE.
 *   body: { rrule, dtStart, dtEnd?, count? } → { dates: [...] }
 *
 * Используется RRULE-конструктором в UI для живого предпросмотра.
 */
import { NextRequest, NextResponse } from 'next/server'
import { previewDates } from '@/lib/org/rrule'
import { getSession } from '@/lib/auth/session'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    if (!body.rrule) {
      return NextResponse.json({ error: 'rrule is required' }, { status: 400 })
    }
    if (!body.dtStart) {
      return NextResponse.json({ error: 'dtStart is required' }, { status: 400 })
    }

    const count = typeof body.count === 'number' && body.count > 0 ? body.count : 5
    const dates = previewDates(body.rrule, new Date(body.dtStart), count)
    return NextResponse.json({
      dates: dates.map((d) => d.toISOString()),
    })
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json({ error: 'Validation failed', message: error.message }, { status: error.statusCode })
    }
    console.error('Failed to preview rrule:', error)
    return NextResponse.json({ error: 'Failed to preview rrule' }, { status: 500 })
  }
}
