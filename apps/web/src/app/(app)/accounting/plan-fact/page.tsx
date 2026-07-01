"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, GitCompareArrowsIcon } from "lucide-react"

import { ApiClientError, parseJson } from "@/lib/api/shared"
import { formatCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface PlanFactRow {
  categoryId: string
  categoryName: string
  planned: number
  actual: number
  variance: number
  percentUsed: number
  transactionCount: number
}
interface PlanFactData {
  scope: string
  period: string
  rows: PlanFactRow[]
  summary: {
    totalPlanned: number
    totalActual: number
    totalVariance: number
    percentUsed: number
    rowCount: number
  }
}

function thisMonthString(offset = 0): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

// Список месяцев для выбора (текущий − 5 ... текущий + 1).
function monthOptions(): { v: string; l: string }[] {
  const names = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
  const out: { v: string; l: string }[] = []
  const d = new Date()
  for (let i = -5; i <= 1; i++) {
    const t = new Date(d.getFullYear(), d.getMonth() + i, 1)
    out.push({ v: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`, l: `${names[t.getMonth()]} ${t.getFullYear()}` })
  }
  return out
}

export default function PlanFactPage() {
  const [data, setData] = useState<PlanFactData | null>(null)
  const [period, setPeriod] = useState(thisMonthString(0))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlanFact = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/accounting/plan-fact?period=${period}&scope=org`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await parseJson<{ data: PlanFactData }>(res)
      setData(json.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить план/факт.")
    } finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchPlanFact() }, [fetchPlanFact])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка...</span>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error || "Не удалось загрузить"}</p>
              <Button variant="outline" onClick={fetchPlanFact}>
                <RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { summary, rows } = data

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <GitCompareArrowsIcon className="size-6" /> План / факт по статьям
        </h1>
        <Select value={period} onValueChange={(v) => { if (v) setPeriod(v) }} items={Object.fromEntries(monthOptions().map((p) => [p.v, p.l]))}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>
            {monthOptions().map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
          </SelectGroup></SelectContent>
        </Select>
      </div>

      {/* Итоги */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <div className="text-muted-foreground text-sm">План</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(summary.totalPlanned)}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-muted-foreground text-sm">Факт</div>
          <div className="text-2xl font-bold mt-1">{formatCurrency(summary.totalActual)}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-muted-foreground text-sm">Отклонение</div>
          <div className={`text-2xl font-bold mt-1 ${summary.totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(summary.totalVariance)}
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="text-muted-foreground text-sm">Освоение плана</div>
          <div className={`text-2xl font-bold mt-1 ${summary.percentUsed > 100 ? "text-red-600" : ""}`}>{summary.percentUsed}%</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium">Статья</th>
                <th className="p-3 font-medium text-right">План</th>
                <th className="p-3 font-medium text-right">Факт</th>
                <th className="p-3 font-medium text-right">Отклонение</th>
                <th className="p-3 font-medium text-right">Освоение</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Нет данных за период</td></tr>
              )}
              {rows.map((r) => {
                const overspent = r.actual > r.planned && r.planned > 0
                const noPlan = r.planned === 0 && r.actual > 0
                return (
                  <tr key={r.categoryId} className="border-b last:border-0">
                    <td className="p-3">
                      <Link href={`/finance/categories/${r.categoryId}`} className="hover:underline">{r.categoryName}</Link>
                      {noPlan && <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">вне плана</Badge>}
                    </td>
                    <td className="p-3 text-right">{formatCurrency(r.planned)}</td>
                    <td className="p-3 text-right">{formatCurrency(r.actual)}</td>
                    <td className={`p-3 text-right ${r.variance < 0 ? "text-red-600" : "text-green-600"}`}>
                      {r.variance > 0 ? "+" : ""}{formatCurrency(r.variance)}
                    </td>
                    <td className="p-3 text-right">
                      {r.planned > 0 ? (
                        <span className={overspent ? "text-red-600 font-medium" : ""}>{r.percentUsed}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 font-medium">
                  <td className="p-3">Итого</td>
                  <td className="p-3 text-right">{formatCurrency(summary.totalPlanned)}</td>
                  <td className="p-3 text-right">{formatCurrency(summary.totalActual)}</td>
                  <td className={`p-3 text-right ${summary.totalVariance < 0 ? "text-red-600" : "text-green-600"}`}>
                    {summary.totalVariance > 0 ? "+" : ""}{formatCurrency(summary.totalVariance)}
                  </td>
                  <td className={`p-3 text-right ${summary.percentUsed > 100 ? "text-red-600" : ""}`}>{summary.percentUsed}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
