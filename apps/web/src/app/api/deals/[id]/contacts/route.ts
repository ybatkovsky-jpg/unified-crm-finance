/**
 * Deal Contacts API — связь сделки с контактными лицами по ролям.
 *
 * GET    /api/deals/:id/contacts          — список контактов сделки
 * POST   /api/deals/:id/contacts          — добавить контакт { contactId, role }
 * DELETE /api/deals/:id/contacts           — убрать контакт { contactId, role? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { dealContacts, isDealContactRole } from '@/lib/db/deal-contacts'
import { deals } from '@/lib/db/deals'
import { getSession } from '@/lib/auth/session'
import { randomUUID } from 'node:crypto'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const deal = await deals.findUnique(id)
    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

    const items = await dealContacts.listByDeal(id)
    return NextResponse.json({ data: items })
  } catch (error) {
    console.error('Failed to fetch deal contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deal contacts', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const deal = await deals.findUnique(id)
    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

    const body = await request.json()
    const contactId = body.contactId
    const role = body.role ?? 'customer'

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }
    if (!isDealContactRole(role)) {
      return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 })
    }

    await dealContacts.add(id, contactId, role)
    const items = await dealContacts.listByDeal(id)
    return NextResponse.json({ data: items }, { status: 201 })
  } catch (error) {
    console.error('Failed to add deal contact:', error)
    return NextResponse.json(
      { error: 'Failed to add deal contact', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const deal = await deals.findUnique(id)
    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const role = searchParams.get('role')

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }

    if (role) {
      await dealContacts.remove(id, contactId, role)
    } else {
      await dealContacts.removeAllForContact(id, contactId)
    }

    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('Failed to remove deal contact:', error)
    return NextResponse.json(
      { error: 'Failed to remove deal contact', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
