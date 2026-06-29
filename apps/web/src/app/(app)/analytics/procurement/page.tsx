"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCwIcon, PackageIcon, TruckIcon, FileTextIcon, ShoppingCartIcon } from "lucide-react"

import { parseJson, ApiClientError } from "@/lib/api/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SupplierData { supplierId: string; supplierName: string; invoiceCount: number; totalAmount: number }
interface MonthlyTrend { month: string; amount: number }
interface ProcurementData {
  summary: {
    purchaseRequestCount: number; invoiceCount: number; deliveryCount: number
    totalProcurementSpend: number; warehouseItemCount: number; stockValue: number
  }
  topSuppliers: SupplierData[]
  monthlyTrend: MonthlyTrend[]
}

function f(a: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(a)
}

const PERIODS = [{ v: "3m", l: "3 months" }, { v: "6m", l: "6 months" }, { v: "12m", l: "12 months" }, { v: "all", l: "All time" }]

export default function ProcurementMetricsPage() {
  const [data, setData] = useState<ProcurementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState("all")

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/analytics/procurement-metrics?period=${period}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData((await parseJson<{ data: ProcurementData }>(res)).data)
    } catch (err) { setError(err instanceof ApiClientError ? err.message : "Failed to load.") }
    finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="container mx-auto p-6 flex justify-center py-12"><RefreshCwIcon className="size-6 animate-spin text-muted-foreground" /><span className="ml-2 text-muted-foreground">Загрузка...</span></div>
  if (error || !data) return <div className="container mx-auto p-6"><Card><CardContent className="pt-6"><div className="flex flex-col items-center gap-3 py-8"><p className="text-destructive">{error || "No data"}</p><Button variant="outline" onClick={fetchData}><RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span></Button></div></CardContent></Card></div>

  const { summary, topSuppliers, monthlyTrend } = data
  const maxMonthAmount = Math.max(...monthlyTrend.map(m => m.amount), 1)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Procurement Metrics</h1>
        <Select value={period} onValueChange={v => { if (v) setPeriod(v) }}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{PERIODS.map(p => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectGroup></SelectContent></Select>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><FileTextIcon className="size-5 mx-auto mb-1 text-muted-foreground" /><div className="text-2xl font-bold">{summary.purchaseRequestCount}</div><div className="text-sm text-muted-foreground">Purchase Requests</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><ShoppingCartIcon className="size-5 mx-auto mb-1 text-muted-foreground" /><div className="text-2xl font-bold">{summary.invoiceCount}</div><div className="text-sm text-muted-foreground">Invoices</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><TruckIcon className="size-5 mx-auto mb-1 text-muted-foreground" /><div className="text-2xl font-bold">{summary.deliveryCount}</div><div className="text-sm text-muted-foreground">Deliveries</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{f(summary.totalProcurementSpend)}</div><div className="text-sm text-muted-foreground">Total Spend</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{summary.warehouseItemCount}</div><div className="text-sm text-muted-foreground">Warehouse Items</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{f(summary.stockValue)}</div><div className="text-sm text-muted-foreground">Stock Value</div></CardContent></Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader><CardTitle>Monthly Procurement Spend</CardTitle></CardHeader>
        <CardContent>
          {monthlyTrend.length === 0 ? <p className="text-muted-foreground text-sm py-4 text-center">Нет данных</p> : (
            <div className="space-y-1">
              {monthlyTrend.map(m => (
                <div key={m.month} className="flex items-center gap-3">
                  <div className="w-20 text-xs text-muted-foreground text-right shrink-0">{m.month}</div>
                  <div className="flex-1">
                    <div className="h-5 bg-purple-500 rounded-r-md flex items-center justify-end px-2 min-w-[40px]" style={{ width: `${Math.max((m.amount / maxMonthAmount) * 100, 5)}%` }}>
                      <span className="text-white text-xs font-semibold">{f(m.amount)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Suppliers */}
      <Card>
        <CardHeader><CardTitle>Top Suppliers by Volume</CardTitle></CardHeader>
        <CardContent>
          {topSuppliers.length === 0 ? <p className="text-muted-foreground text-sm py-4 text-center">Нет данных</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left py-2">#</th><th className="text-left py-2">Supplier</th><th className="text-right py-2">Invoices</th><th className="text-right py-2">Total Amount</th></tr></thead>
                <tbody>
                  {topSuppliers.map((s, i) => (
                    <tr key={s.supplierId} className="border-b hover:bg-muted/50">
                      <td className="py-2 text-muted-foreground">{i + 1}</td>
                      <td className="py-2 font-medium">{s.supplierName}</td>
                      <td className="py-2 text-right">{s.invoiceCount}</td>
                      <td className="py-2 text-right font-medium">{f(s.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
