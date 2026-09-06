/**
 * Одно КП (CommercialOffer).
 *
 * GET    /api/offers/[id]
 * PATCH  /api/offers/[id]  — title/amount/status/validUntil/notes
 * DELETE /api/offers/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { offers } from '@/lib/db/offers'
import { getSession } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const offer = await offers.findById(id)
    if (!offer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: offer })
  } catch (error) {
    console.error('Failed to fetch offer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offer', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await offers.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.amount !== undefined) data.amount = body.amount
    if (body.status !== undefined) data.status = body.status
    if (body.validUntil !== undefined) data.validUntil = body.validUntil ? new Date(body.validUntil) : null
    if (body.notes !== undefined) data.notes = body.notes

    const updated = await offers.update(id, data)
    return NextResponse.json({ data: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('not found') ? 404 : 500
    if (status === 500) console.error('Failed to update offer:', error)
    return NextResponse.json({ error: 'Failed to update offer', message }, { status })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await offers.findById(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await offers.delete(id)
    return NextResponse.json({ data: { id }, message: 'Offer deleted' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = message.includes('not found') ? 404 : 500
    if (status === 500) console.error('Failed to delete offer:', error)
    return NextResponse.json({ error: 'Failed to delete offer', message }, { status })
  }
}
