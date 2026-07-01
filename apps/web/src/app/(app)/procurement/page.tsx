"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  RefreshCwIcon, PackageIcon, TruckIcon, FileTextIcon, ShoppingCartIcon,
  ReceiptIcon, CheckSquareIcon, Building2Icon, ArrowRightIcon,
} from "lucide-react"

import { ApiClientError, parseJson } from "@/lib/api/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProcurementSummary {
  summary: {
    purchaseRequestCount: number
    invoiceCount: number
    deliveryCount: number
    totalProcurementSpend: number
    warehouseItemCount: number
    stockQuantity: number
  }
}

function formatCurrency(a: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(a)
}

export default function ProcurementDashboardPage() {
  const [data, setData] = useState<ProcurementSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/analytics/procurement-metrics?period=all")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await parseJson<{ data: ProcurementSummary }>(res)
      setData(json.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить панель закупок.")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка панели...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchData}>
                <RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { summary } = data ?? { summary: { purchaseRequestCount: 0, invoiceCount: 0, deliveryCount: 0, totalProcurementSpend: 0, warehouseItemCount: 0, stockQuantity: 0 } }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Закупки</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Управление заявками, счетами, поставками и складом
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileTextIcon className="size-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{summary.purchaseRequestCount}</div>
            <div className="text-xs text-muted-foreground">Заявки</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ShoppingCartIcon className="size-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{summary.invoiceCount}</div>
            <div className="text-xs text-muted-foreground">Счета</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckSquareIcon className="size-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{summary.deliveryCount}</div>
            <div className="text-xs text-muted-foreground">Поставки</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <PackageIcon className="size-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{summary.warehouseItemCount}</div>
            <div className="text-xs text-muted-foreground">Позиций</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TruckIcon className="size-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{summary.stockQuantity}</div>
            <div className="text-xs text-muted-foreground">Единиц</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ReceiptIcon className="size-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-2xl font-bold">{formatCurrency(summary.totalProcurementSpend)}</div>
            <div className="text-xs text-muted-foreground">Расходы</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Быстрый доступ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <QuickLink href="/procurement/counterparties" icon={Building2Icon} label="Контрагенты" desc="Поставщики и подрядчики" />
          <QuickLink href="/procurement/purchase-requests" icon={FileTextIcon} label="Заявки на закупку" desc="Создание и отслеживание" />
          <QuickLink href="/procurement/invoices" icon={ShoppingCartIcon} label="Счета" desc="Входящие счета поставщиков" />
          <QuickLink href="/procurement/approvals" icon={CheckSquareIcon} label="Согласование" desc="Утверждение заявок" />
          <QuickLink href="/procurement/warehouse" icon={PackageIcon} label="Склад" desc="Учёт материалов" />
          <QuickLink href="/procurement/deliveries" icon={TruckIcon} label="Поставки" desc="Приёмка и статусы" />
        </div>
      </div>
    </div>
  )
}

function QuickLink({ href, icon: Icon, label, desc }: {
  href: string; icon: typeof FileTextIcon; label: string; desc: string
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary transition-colors cursor-pointer h-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Icon className="size-5 text-muted-foreground" />
            <ArrowRightIcon className="size-4 text-muted-foreground" />
          </div>
          <div className="font-medium mt-2">{label}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </CardContent>
      </Card>
    </Link>
  )
}
