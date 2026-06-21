/**
 * Convert Deal to Contract API Endpoint
 *
 * Converts a deal into a contract:
 * - POST: Convert deal to contract
 *
 * POST /api/deals/[id]/convert
 */

import { NextRequest, NextResponse } from 'next/server'
import { contracts } from '@/lib/db/contracts'
import { prisma } from '@/lib/db/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/deals/[id]/convert
 *
 * Converts a deal to a contract.
 * Creates a contract from deal data and links them.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: dealId } = await params
    const body = await request.json()

    // Verify deal exists
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, deletedAt: null },
      include: { contact: true },
    })

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found', message: `Deal with id ${dealId} not found` },
        { status: 404 }
      )
    }

    // Check if contract already exists
    const existingContract = await contracts.findByDeal(dealId)
    if (existingContract) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Contract already exists for this deal' },
        { status: 409 }
      )
    }

    // Create contract from deal
    const contract = await contracts.convertFromDeal(dealId, {
      title: body.title,
      amount: body.amount,
      currency: body.currency,
      startDate: body.startDate,
      endDate: body.endDate,
      notes: body.notes,
    })

    // Fetch updated deal with contract link
    const updatedDeal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        stage: true,
        pipeline: true,
        contact: true,
        manager: true,
      },
    })

    return NextResponse.json({
      data: {
        contract,
        deal: updatedDeal,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to convert deal to contract:', error)
    return NextResponse.json(
      { error: 'Failed to convert deal to contract', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
