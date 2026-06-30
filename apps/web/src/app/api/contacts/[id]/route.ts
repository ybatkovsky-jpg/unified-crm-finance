/**
 * Single Contact API Endpoint
 *
 * CRUD API for individual Contact by ID:
 * - GET: Fetch a single contact (with Employees for companies, Company for persons)
 * - PUT: Update a contact
 * - DELETE: Soft-delete a contact
 */

import { NextRequest, NextResponse } from 'next/server'
import { contacts } from '../../../../lib/db/contacts'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const contact = await contacts.findUnique(id, {
      Company: { select: { id: true, companyName: true } },
      Employees: { select: { id: true, firstName: true, lastName: true, position: true, phone: true, email: true } },
    })

    if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: contact })
  } catch (error) {
    console.error('Failed to fetch contact:', error)
    return NextResponse.json({ error: 'Failed to fetch contact', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const existing = await contacts.findUnique(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (body.type === 'person' && body.firstName === '') {
      return NextResponse.json({ error: 'Validation failed', message: 'firstName cannot be empty' }, { status: 400 })
    }
    if (body.type === 'company' && body.companyName === '') {
      return NextResponse.json({ error: 'Validation failed', message: 'companyName cannot be empty' }, { status: 400 })
    }

    if (body.companyId !== undefined) {
      if (body.companyId && body.companyId === id) {
        return NextResponse.json({ error: 'Validation failed', message: 'companyId cannot reference self' }, { status: 400 })
      }
      const targetType = body.type ?? existing.type
      if (body.companyId && targetType !== 'person') {
        return NextResponse.json({ error: 'Validation failed', message: 'companyId only for person contacts' }, { status: 400 })
      }
      if (body.companyId) {
        const company = await contacts.findUnique(body.companyId)
        if (!company || company.type !== 'company') {
          return NextResponse.json({ error: 'Validation failed', message: 'companyId must reference an existing company' }, { status: 400 })
        }
      }
    }

    // Inline field validation
    if (body.firstName && !/^[\p{L}\s\-.\u0301']+$/u.test(body.firstName)) {
      return NextResponse.json({ error: 'Validation failed', message: 'Имя должно содержать только буквы' }, { status: 400 })
    }
    if (body.lastName && !/^[\p{L}\s\-.\u0301']+$/u.test(body.lastName)) {
      return NextResponse.json({ error: 'Validation failed', message: 'Фамилия должна содержать только буквы' }, { status: 400 })
    }
    if (body.phone && typeof body.phone === 'string') {
      const cleaned = body.phone.replace(/[\s\-()]/g, '')
      if (!/^\+?\d{7,15}$/.test(cleaned)) {
        return NextResponse.json({ error: 'Validation failed', message: 'Неверный формат телефона' }, { status: 400 })
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

    // Build update payload
    const fields = ['type','firstName','lastName','middleName','companyName','inn','kpp','ogrn','email','phone','address','physicalAddress','position','notes','sourceId','ownerId','companyId','status','tags','attributes']
    const updateData: Record<string, unknown> = {}
    for (const f of fields) {
      if (body[f] !== undefined) updateData[f] = body[f]
    }

    const updated = await contacts.update(id, updateData as any)
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('Failed to update contact:', error)
    return NextResponse.json({ error: 'Failed to update contact', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await contacts.softDelete(id)
    return NextResponse.json({ data: { id }, message: 'Contact soft-deleted successfully' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('not found')) {
      return NextResponse.json({ error: 'Not found', message }, { status: 404 })
    }
    console.error('Failed to delete contact:', error)
    return NextResponse.json({ error: 'Failed to delete contact', message }, { status: 500 })
  }
}
