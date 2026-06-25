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
import { contracts } from '@/lib/db/contracts'

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
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'title is required' },
        { status: 400 }
      )
    }

    if (!body.contactId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'contactId is required' },
        { status: 400 }
      )
    }

    // Prepare creation data
    const createData = {
      title: body.title,
      contactId: body.contactId,
      dealId: body.dealId || null,
      templateId: body.templateId || null,
      amount: body.amount ?? 0,
      currency: body.currency ?? 'RUB',
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      status: body.status ?? 'draft',
      notes: body.notes || null,
      attributes: body.attributes || null,
    }

    const newContract = await contracts.create(createData)

    return NextResponse.json({ data: newContract }, { status: 201 })
  } catch (error) {
    console.error('Failed to create contract:', error)
    return NextResponse.json(
      { error: 'Failed to create contract', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
