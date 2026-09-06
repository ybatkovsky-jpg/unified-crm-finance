/**
 * POST /api/invoices/[id]/pay
 *
 * Pays an invoice by:
 * 1. Creating a Transaction (type=expense, факт) linked to the invoice
 * 2. Realizing a linked planned CashFlowPayment → paid (если есть связанный плановый платёж)
 * 3. Updating Invoice.paidAt
 *
 * Body: { amount, date?, description? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/db/prisma'
import { randomUUID } from 'node:crypto'
import { notifyPaymentReceived } from '../../../../../lib/notifications/events'
import { getSession } from '@/lib/auth/session'
import { requireSectionWrite } from '@/lib/auth/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const session = await getSession()
    const denied = requireSectionWrite(session, 'procurement')
    if (denied) return denied
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      // 1. Create Transaction (факт)
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
          createdBy: session.id,
          updatedAt: new Date(),
        },
      })

      // 2. Realize linked planned payment → paid (не создаём дубль)
      const planned = await tx.cashFlowPayment.findFirst({
        where: {
          invoiceId: invoice.id,
          status: { in: ['planned', 'scheduled'] },
        },
        orderBy: { date: 'asc' },
      })
      const payment = planned
        ? await tx.cashFlowPayment.update({
            where: { id: planned.id },
            data: {
              status: 'paid',
              amount,
              date,
              updatedAt: new Date(),
            },
          })
        : null

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
