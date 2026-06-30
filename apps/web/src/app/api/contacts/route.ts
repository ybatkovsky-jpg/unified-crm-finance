/**
 * Contacts Collection API Endpoint
 *
 * CRUD API for Contact model:
 * - GET: List all contacts (excluding soft-deleted)
 * - POST: Create a new contact
 */

import { NextRequest, NextResponse } from 'next/server'
import { contacts } from '../../../lib/db/contacts'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const sp = request.nextUrl.searchParams
    const where: Record<string, unknown> = {}
    const type = sp.get('type')
    const status = sp.get('status')
    const companyId = sp.get('companyId')
    if (type) where.type = type
    if (status) where.status = status
    if (companyId) where.companyId = companyId

    const all = await contacts.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ data: all, count: all.length })
  } catch (error) {
    console.error('Failed to fetch contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    if (!body.type || (body.type !== 'person' && body.type !== 'company')) {
      return NextResponse.json({ error: 'Validation failed', message: 'type must be "person" or "company"' }, { status: 400 })
    }
    if (body.type === 'person' && !body.firstName) {
      return NextResponse.json({ error: 'Validation failed', message: 'firstName is required for person' }, { status: 400 })
    }
    if (body.type === 'company' && !body.companyName) {
      return NextResponse.json({ error: 'Validation failed', message: 'companyName is required for company' }, { status: 400 })
    }
    if (!body.phone) {
      return NextResponse.json({ error: 'Validation failed', message: 'phone is required' }, { status: 400 })
    }

    // Inline field validation
    const nameRe = /^[\p{L}\s\-.\u0301']+$/u
    if (body.firstName && !nameRe.test(body.firstName)) {
      return NextResponse.json({ error: 'Validation failed', message: 'Имя должно содержать только буквы' }, { status: 400 })
    }
    if (body.lastName && !nameRe.test(body.lastName)) {
      return NextResponse.json({ error: 'Validation failed', message: 'Фамилия должна содержать только буквы' }, { status: 400 })
    }
    if (body.phone) {
      const cleaned = String(body.phone).replace(/[\s\-()]/g, '')
      if (!/^\+?\d{7,15}$/.test(cleaned)) {
        return NextResponse.json({ error: 'Validation failed', message: 'Неверный формат телефона (7–15 цифр)' }, { status: 400 })
      }
    }
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Validation failed', message: 'Неверный формат email' }, { status: 400 })
    }
    if (body.inn && !/^\d{10,12}$/.test(body.inn)) {
      return NextResponse.json({ error: 'Validation failed', message: 'ИНН: 10 или 12 цифр' }, { status: 400 })
    }
    if (body.kpp && !/^\d{9}$/.test(body.kpp)) {
      return NextResponse.json({ error: 'Validation failed', message: 'КПП: 9 цифр' }, { status: 400 })
    }
    if (body.ogrn && !/^\d{13}$/.test(body.ogrn)) {
      return NextResponse.json({ error: 'Validation failed', message: 'ОГРН: 13 цифр' }, { status: 400 })
    }

    if (body.companyId) {
      if (body.type !== 'person') {
        return NextResponse.json({ error: 'Validation failed', message: 'companyId only for person contacts' }, { status: 400 })
      }
      const company = await contacts.findUnique(body.companyId)
      if (!company || company.type !== 'company') {
        return NextResponse.json({ error: 'Validation failed', message: 'companyId must reference an existing company' }, { status: 400 })
      }
    }

    const createData = {
      type: body.type, phone: body.phone,
      firstName: body.firstName || null, lastName: body.lastName || null, middleName: body.middleName || null,
      companyName: body.companyName || null, inn: body.inn || null, kpp: body.kpp || null, ogrn: body.ogrn || null,
      email: body.email || null, address: body.address || null, physicalAddress: body.physicalAddress || null,
      position: body.position || null, notes: body.notes || null,
      sourceId: body.sourceId || null, ownerId: body.ownerId || null, companyId: body.companyId || null,
      status: body.status || 'active', tags: body.tags || [], attributes: body.attributes || null,
    }

    const newContact = await contacts.create(createData)
    return NextResponse.json({ data: newContact }, { status: 201 })
  } catch (error) {
    console.error('Failed to create contact:', error)
    return NextResponse.json({ error: 'Failed to create contact', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
