/**
 * КП по сделке (CommercialOffer).
 *
 * GET  /api/deals/[id]/offers — список версий КП сделки
 * POST /api/deals/[id]/offers — создать новую версию КП
 *   body: { title?, amount?, status?, validUntil?, notes? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { offers } from '@/lib/db/offers'
import { deals } from '@/lib/db/deals'
import { getSession } from '@/lib/auth/session'
import { randomUUID } from 'node:crypto'

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

    const deal = await deals.findUnique(id)
    if (!deal) return NextResponse.json({ error: 'Not found', message: `Deal ${id} not found` }, { status: 404 })

    const list = await offers.findByDeal(id)
    return NextResponse.json({ data: list })
  } catch (error) {
    console.error('Failed to fetch offers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const deal = await deals.findUnique(id)
    if (!deal) return NextResponse.json({ error: 'Not found', message: `Deal ${id} not found` }, { status: 404 })

    const body = await request.json()
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Коммерческое предложение'
    const amount = typeof body.amount === 'number' ? body.amount : 0
    const status = typeof body.status === 'string' ? body.status : 'draft'
    const validUntil = body.validUntil ? new Date(body.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const notes = typeof body.notes === 'string' ? body.notes : null

    const created = await prisma.$transaction(async (tx: any) => {
      const year = new Date().getFullYear()
      const seq = (await tx.commercialOffer.count({ where: { number: { startsWith: `КП${year}` } } })) + 1
      const number = `КП${year}-${String(seq).padStart(4, '0')}`
      const version = (await tx.commercialOffer.count({ where: { dealId: id } })) + 1

      return tx.commercialOffer.create({
        data: {
          id: randomUUID(),
          dealId: id,
          number,
          title,
          amount,
          version,
          status,
          validUntil,
          notes,
          updatedAt: new Date(),
        },
      })
    })

    return NextResponse.json({ data: created }, { status: 201 })
  } catch (error) {
    console.error('Failed to create offer:', error)
    return NextResponse.json(
      { error: 'Failed to create offer', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
