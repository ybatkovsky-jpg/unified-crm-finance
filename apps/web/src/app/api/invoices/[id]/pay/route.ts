/**
 * POST /api/invoices/[id]/pay
 *
 * Pays an invoice by creating:
 * 1. A Transaction (type=expense) linked to the invoice
 * 2. A CashFlowPayment (status=paid)
 * 3. Updates Invoice.paidAt
 *
 * Body: { amount, date?, description? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db/prisma'
import { randomUUID } from 'node:crypto'
import { notifyPaymentReceived } from '../../../../../lib/notifications/events'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'id is required' },
        { status: 400 }
      )
    }

    // Fetch invoice with items to get project/counterparty context
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        InvoiceItem: {
          include: {
            BOMItem: {
              include: {
                BOM: {
                  select: { projectId: true },
                },
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Not found', message: `Invoice ${id} not found` },
        { status: 404 }
      )
    }

    if (invoice.paidAt) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Invoice already paid' },
        { status: 409 }
      )
    }

    const amount = body.amount ?? invoice.totalAmount
    const date = body.date ? new Date(body.date) : new Date()
    const description = body.description ?? `Payment for invoice #${invoice.number ?? id}`

    // Derive projectId from BOM chain
    const projectId =
      body.projectId ??
      invoice.InvoiceItem?.[0]?.BOMItem?.BOM?.projectId ??
      null

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          id: randomUUID(),
          date,
          amount,
          type: 'expense',
          source: 'invoice_payment',
          status: 'confirmed',
          description,
          categoryId: body.categoryId ?? '00000000-0000-0000-0000-000000000000', // default expense category
          projectId,
          counterpartyId: invoice.supplierId,
          invoiceId: invoice.id,
          createdBy: body.createdBy ?? 'system',
          updatedAt: new Date(),
        },
      })

      // 2. Create CashFlowPayment
      const payment = await tx.cashFlowPayment.create({
        data: {
          id: randomUUID(),
          date,
          amount,
          type: 'expense',
          status: 'paid',
          description,
          projectId,
          counterpartyId: invoice.supplierId,
          invoiceId: invoice.id,
          updatedAt: new Date(),
        },
      })

      // 3. Update invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          paidAt: date,
          status: body.invoiceStatus ?? invoice.status,
        },
      })

      return { transaction, payment, updatedInvoice }
    })

    // PLAT-02: уведомление об оплате счёта (директору + менеджеру проекта).
    // Побочный эффект — не ломает ответ.
    if (projectId) {
      void (async () => {
        try {
          const [project, director] = await Promise.all([
            prisma.project.findUnique({ where: { id: projectId }, select: { name: true, managerId: true } }),
            prisma.user.findFirst({
              where: { deletedAt: null, isActive: true, UserRole: { some: { Role: { code: 'director' } } } },
              select: { id: true },
            }),
          ])
          const userIds = [director?.id, project?.managerId].filter((x): x is string => !!x)
          if (userIds.length && project) {
            await notifyPaymentReceived(userIds, project.name, Number(amount), projectId)
          }
        } catch (err) {
          console.error('[invoice pay] notification failed:', err)
        }
      })()
    }

    return NextResponse.json({
      data: result,
      message: 'Invoice paid successfully',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: 'Not found', message },
        { status: 404 }
      )
    }

    console.error('Failed to pay invoice:', error)
    return NextResponse.json(
      { error: 'Failed to pay invoice', message },
      { status: 500 }
    )
  }
}
