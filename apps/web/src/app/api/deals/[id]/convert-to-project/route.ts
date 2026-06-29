/**
 * Unified Convert Deal to Project & Contract
 *
 * Создаёт проект И договор с ОДНИМ общим номером ПМ{YYYY}-{NNNN},
 * линкует оба на сделку, переводит сделку на стадию «contract»
 * и записывает историю — всё в одной атомарной транзакции.
 *
 * ТЗ CRM-07: единый номер для проекта и договора.
 *
 * POST /api/deals/[id]/convert-to-project
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db/prisma'
import { requireSession } from '@/lib/auth/session'
import { nextProjectNumber } from '@/lib/db/sequence'
import { randomUUID } from 'node:crypto'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const { id: dealId } = await params
    const body = await request.json()

    // Verify deal exists and not already linked
    const deal = await prisma.deal.findFirst({
      where: { id: dealId, deletedAt: null },
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

    if (deal.contractId) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Deal already linked to a contract', contractId: deal.contractId },
        { status: 409 }
      )
    }

    if (!deal.contactId) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Deal must have a contact before converting to project' },
        { status: 400 }
      )
    }

    // Find the «contract» stage in the deal's pipeline
    const contractStage = await prisma.dealStage.findFirst({
      where: { pipelineId: deal.pipelineId, code: 'contract' },
    })

    if (!contractStage) {
      return NextResponse.json(
        { error: 'Pipeline error', message: 'No "contract" stage found in pipeline' },
        { status: 500 }
      )
    }

    const now = new Date()
    const year = now.getFullYear()

    // Единая атомарная транзакция: проект + договор + линковка + история + смена стадии
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate shared number (atomic inside tx)
      const sharedNumber = await nextProjectNumber(tx, year)

      // 2. Create project
      const project = await tx.project.create({
        data: {
          id: randomUUID(),
          externalNumber: sharedNumber,
          name: body.name || deal.title,
          description: body.description || deal.description || null,
          dealId: deal.id,
          contactId: deal.contactId!,
          managerId: body.managerId || deal.managerId || null,
          contractAmount: body.contractAmount ?? deal.amount,
          currency: body.currency ?? deal.currency,
          startDate: body.startDate ? new Date(body.startDate) : now,
          endDate: body.endDate ? new Date(body.endDate) : null,
          status: 'lead',
          updatedAt: now,
        },
      })

      // 3. Create contract with the SAME shared number
      const contract = await tx.contract.create({
        data: {
          id: randomUUID(),
          number: sharedNumber,
          dealId: deal.id,
          contactId: deal.contactId!,
          title: `Договор: ${body.name || deal.title}`,
          amount: body.contractAmount ?? deal.amount,
          currency: body.currency ?? deal.currency,
          notes: body.description || deal.description || undefined,
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        },
      })

      // 4. Record stage history
      await tx.dealHistory.create({
        data: {
          id: randomUUID(),
          dealId: deal.id,
          fromStageId: deal.stageId,
          toStageId: contractStage.id,
          comment: 'Auto: created project & contract',
          changedBy: session.id,
          changedAt: now,
        },
      })

      // 5. Update deal: link project + contract + move to contract stage
      await tx.deal.update({
        where: { id: dealId },
        data: {
          projectId: project.id,
          contractId: contract.id,
          stageId: contractStage.id,
          updatedAt: now,
        },
      })

      return { project, contract, sharedNumber }
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('Failed to convert deal to project:', error)
    return NextResponse.json(
      { error: 'Failed to convert deal to project', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
