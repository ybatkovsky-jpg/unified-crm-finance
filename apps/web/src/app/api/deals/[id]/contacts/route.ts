/**
 * Deal Contacts API — связь сделки с контактными лицами.
 *
 * GET    /api/deals/:id/contacts          — список контактов сделки
 * POST   /api/deals/:id/contacts          — добавить:
 *   - простой режим: { contactId, role }
 *   - создание физлица: { mode: 'individual', person, role }
 *   - создание организации+сотрудники: { mode: 'company', company, employees, companyRole }
 * DELETE /api/deals/:id/contacts?contactId=&role= — отвязать (не удаляет Contact)
 */

import { NextRequest, NextResponse } from 'next/server'
import { dealContacts } from '@/lib/db/deal-contacts'
import { deals } from '@/lib/db/deals'
import { getSession } from '@/lib/auth/session'
import {
  addIndividualToDeal,
  addCompanyWithEmployeesToDeal,
  unlinkContactFromDeal,
} from '@/lib/services/deal-contact-service'

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

    // ── Режим: создание физлица с паспортом ──
    if (body.mode === 'individual') {
      const result = await addIndividualToDeal(id, body)
      return NextResponse.json({ data: result }, { status: 201 })
    }

    // ── Режим: организация + сотрудники ──
    if (body.mode === 'company') {
      const result = await addCompanyWithEmployeesToDeal(id, body)
      return NextResponse.json({ data: result }, { status: 201 })
    }

    // ── Простой режим: привязать существующий контакт с ролью ──
    const contactId = body.contactId
    const role = typeof body.role === 'string' && body.role.trim() ? body.role.trim() : 'Контакт'

    if (!contactId) {
      return NextResponse.json({ error: 'contactId is required' }, { status: 400 })
    }

    await dealContacts.add(id, contactId, role)
    const items = await dealContacts.listByDeal(id)
    return NextResponse.json({ data: items }, { status: 201 })
  } catch (error) {
    console.error('Failed to add deal contact:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    // Валидационные ошибки → 400
    const status = message.includes('обязатель') || message.includes('не является') || message.includes('не найден')
      ? 400
      : 500
    return NextResponse.json({ error: 'Failed to add deal contact', message }, { status })
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

    const result = await unlinkContactFromDeal(
      id,
      contactId,
      role || undefined,
    )

    return NextResponse.json({ data: { deleted: result.count } })
  } catch (error) {
    console.error('Failed to remove deal contact:', error)
    return NextResponse.json(
      { error: 'Failed to remove deal contact', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
