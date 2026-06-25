/**
 * Convert Deal to Project API Endpoint
 *
 * Creates a project from a deal, linking them bidirectionally.
 *
 * POST /api/deals/[id]/create-project
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db/prisma'
import { randomUUID } from 'node:crypto'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: dealId } = await params
    const body = await request.json()

    // Verify deal exists and not already linked to a project
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, deletedAt: null },
      include: { Contact: true },
    })

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found', message: `Deal ${dealId} not found` },
        { status: 404 }
      )
    }

    if (deal.projectId) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Deal already linked to a project', projectId: deal.projectId },
        { status: 409 }
      )
    }

    // Generate project number
    const now = new Date()
    const year = now.getFullYear()
    const count = await prisma.project.count({
      where: { externalNumber: { startsWith: `ПМ-${year}` } },
    })
    const externalNumber = `ПМ-${year}-${String(count + 1).padStart(5, '0')}`

    // Create project in a transaction (atomic: project + deal link)
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          id: randomUUID(),
          externalNumber,
          name: body.name || deal.title,
          description: body.description || deal.description || null,
          dealId: deal.id,
          contactId: body.contactId || deal.contactId || null,
          managerId: body.managerId || deal.managerId || null,
          contractAmount: body.contractAmount ?? deal.amount,
          currency: body.currency ?? deal.currency,
          startDate: body.startDate ? new Date(body.startDate) : new Date(),
          endDate: body.endDate ? new Date(body.endDate) : null,
          status: 'lead',
          updatedAt: now,
        },
      })

      // Update deal with projectId
      await tx.deal.update({
        where: { id: dealId },
        data: { projectId: project.id, updatedAt: now },
      })

      return project
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('Failed to create project from deal:', error)
    return NextResponse.json(
      { error: 'Failed to create project from deal', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
