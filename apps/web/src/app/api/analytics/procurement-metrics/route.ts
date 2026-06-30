/**
 * GET /api/analytics/procurement-metrics
 *
 * Procurement cycle times and supplier analytics.
 * Query params: period
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db/prisma'
import { getSession } from '@/lib/auth/session'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // RBAC-fix: procurement-метрики доступны director и supply.
    const canView = session.roleCodes.includes('director') || session.roleCodes.includes('supply')
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden', message: 'Нет доступа к метрикам закупок' }, { status: 403 })
    }
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') ?? 'all'

    let dateFrom: Date | undefined
    const now = new Date()
    switch (period) {
      case '3m': dateFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1); break
      case '6m': dateFrom = new Date(now.getFullYear(), now.getMonth() - 6, 1); break
      case '12m': dateFrom = new Date(now.getFullYear() - 1, now.getMonth(), 1); break
    }

    // Count stats
    const purchaseRequestCount = await prisma.purchaseRequest.count({
      ...(dateFrom ? { where: { createdAt: { gte: dateFrom } } } : {}),
    })
    const invoiceCount = await prisma.invoice.count({
      ...(dateFrom ? { where: { createdAt: { gte: dateFrom } } } : {}),
    })
    const deliveryCount = await prisma.delivery.count({
      ...(dateFrom ? { where: { createdAt: { gte: dateFrom } } } : {}),
    })

    // Top suppliers by invoice amount
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),
      },
      include: {
        Counterparty: { select: { id: true, name: true } },
      },
    })

    const supplierMap = new Map<string, { name: string; invoiceCount: number; totalAmount: number }>()
    for (const inv of invoices) {
      const supplierId = inv.Counterparty?.id ?? 'unknown'
      const existing = supplierMap.get(supplierId) ?? { name: inv.Counterparty?.name ?? 'Unknown', invoiceCount: 0, totalAmount: 0 }
      existing.invoiceCount++
      existing.totalAmount += Number(inv.totalAmount ?? 0)
      supplierMap.set(supplierId, existing)
    }

    const topSuppliers = Array.from(supplierMap.entries())
      .map(([id, data]) => ({ supplierId: id, supplierName: data.name, invoiceCount: data.invoiceCount, totalAmount: data.totalAmount }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)

    // Total procurement spend
    const totalProcurementSpend = invoices.reduce((s, inv) => s + Number(inv.totalAmount ?? 0), 0)

    // Warehouse stats
    const warehouseItemCount = await prisma.warehouseItem.count()
    // Семантический фикс: это кол-во единиц, а не ₽ (стоимость). Переименовано stockValue → stockQuantity.
    const stockQuantityAgg = await prisma.warehouseItem.aggregate({
      _sum: { quantity: true },
    })

    // Monthly procurement trend
    const monthlyInvoices = invoices.reduce((acc, inv) => {
      const key = `${inv.createdAt.getFullYear()}-${String(inv.createdAt.getMonth() + 1).padStart(2, '0')}`
      acc.set(key, (acc.get(key) ?? 0) + Number(inv.totalAmount ?? 0))
      return acc
    }, new Map<string, number>())

    const monthlyTrend = Array.from(monthlyInvoices.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }))

    return NextResponse.json({
      data: {
        summary: {
          purchaseRequestCount,
          invoiceCount,
          deliveryCount,
          totalProcurementSpend,
          warehouseItemCount,
          stockQuantity: stockQuantityAgg._sum.quantity ?? 0,
        },
        topSuppliers,
        monthlyTrend,
      },
    })
  } catch (error) {
    console.error('Failed to compute procurement metrics:', error)
    return NextResponse.json(
      { error: 'Failed to compute metrics', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
