/**
 * Contracts Collection API Endpoint
 *
 * CRUD API for Contract model:
 * - GET: List all contracts (excluding soft-deleted)
 * - POST: Create a new contract
 *
 * GET /api/contracts
 * POST /api/contracts
 */

import { NextRequest, NextResponse } from 'next/server'
import { contracts, type ContractCreateInput } from '@/lib/db/contracts'
import { getSession } from '@/lib/auth/session'
import { isAdmin } from '@/lib/auth/permissions'

/**
 * GET /api/contracts
 *
 * Returns all active contracts (excludes soft-deleted).
 * Supports optional query parameters for filtering.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const contactId = searchParams.get('contactId')
    const dealId = searchParams.get('dealId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (contactId) where.contactId = contactId
    if (dealId) where.dealId = dealId

    const allContracts = await contracts.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        Contact: true,
        ContractSigner: true,
        ContractVersion: true,
        ContractTemplate: true,
      },
    })

    // Map Prisma PascalCase relations to API lowercase shape
    const mapped = allContracts.map((c) => {
      const { Contact, ContractSigner, ContractVersion, ContractTemplate, ...rest } = c as Record<string, unknown> & { Contact?: unknown; ContractSigner?: unknown; ContractVersion?: unknown; ContractTemplate?: unknown }
      return {
        ...rest,
        contact: Contact ?? null,
        signers: ContractSigner ?? [],
        versions: ContractVersion ?? [],
        template: ContractTemplate ?? null,
      }
    })

    return NextResponse.json({ data: mapped, count: mapped.length })
  } catch (error) {
    console.error('Failed to fetch contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contracts
 *
 * Creates a new contract.
 * Validates required fields.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()

    // Договор создаётся только из сделки.
    if (!body.dealId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Договор создаётся только из сделки (укажите dealId)' },
        { status: 400 }
      )
    }

    // По умолчанию данные берутся из сделки; поля тела запроса — переопределения.
    const additionalData: Partial<ContractCreateInput> = {}
    if (body.title) additionalData.title = body.title
    if (body.templateId) additionalData.templateId = body.templateId
    if (typeof body.amount === 'number' && !Number.isNaN(body.amount)) additionalData.amount = body.amount
    if (body.currency) additionalData.currency = body.currency
    if (body.startDate) additionalData.startDate = new Date(body.startDate)
    if (body.endDate) additionalData.endDate = new Date(body.endDate)
    if (body.status) additionalData.status = body.status
    if (body.notes) additionalData.notes = body.notes
    if (body.attributes) additionalData.attributes = body.attributes

    const newContract = await contracts.convertFromDeal(body.dealId, additionalData)

    return NextResponse.json({ data: newContract }, { status: 201 })
  } catch (error) {
    console.error('Failed to create contract:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Deal not found', message: 'Сделка не найдена' },
        { status: 404 }
      )
    }
    if (message.includes('Contract already exists')) {
      return NextResponse.json(
        { error: 'Conflict', message: 'По этой сделке уже существует договор' },
        { status: 409 }
      )
    }
    if (message.includes('deal has no contact')) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'У сделки не указан контакт — сначала привяжите контакт к сделке' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create contract', message },
      { status: 500 }
    )
  }
}
