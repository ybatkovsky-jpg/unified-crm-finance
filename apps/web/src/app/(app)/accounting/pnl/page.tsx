"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, ScaleIcon } from "lucide-react"

import { ApiClientError, parseJson } from "@/lib/api/shared"
import { formatCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface ArticleRow {
  categoryId: string
  categoryName: string
  amount: number
  transactionCount: number
}
interface PnlData {
  period: string
  income: ArticleRow[]
  constantExpenses: ArticleRow[]
  projectExpenses: ArticleRow[]
  summary: {
    totalIncome: number
    totalConstantExpenses: number
    totalProjectExpenses: number
    totalExpenses: number
    netProfit: number
    marginPct: number
  }
  estimatedUsnTax: { base: number; tax15: number; min1pct: number; applicable: number }
}

// Месяцы/кварталы/год — периода для орг-учёта.
const PERIODS = [
  { v: "this-month", l: "Этот месяц" },
  { v: "prev-month", l: "Прошлый месяц" },
  { v: "3m", l: "3 месяца" },
  { v: "6m", l: "6 месяцев" },
  { v: "12m", l: "12 месяцев" },
]

function thisMonthString(offset = 0): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function PnlPage() {
  const [data, setData] = useState<PnlData | null>(null)
  const [period, setPeriod] = useState("3m")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPnl = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      // Локальные period-ключи ("this-month" и т.д.) → серверный формат.
      const serverPeriod =
        period === "this-month" ? thisMonthString(0)
        : period === "prev-month" ? thisMonthString(-1)
        : period
      const res = await fetch(`/api/accounting/pnl?period=${serverPeriod}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await parseJson<{ data: PnlData }>(res)
      setData(json.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить P&L.")
    } finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchPnl() }, [fetchPnl])

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
              <Button variant="outline" onClick={fetchPnl}>
                <RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { summary, estimatedUsnTax } = data

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">P&L — прибыли и убытки</h1>
        <Select value={period} onValueChange={(v) => { if (v) setPeriod(v) }} items={Object.fromEntries(PERIODS.map((p) => [p.v, p.l]))}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>
            {PERIODS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
          </SelectGroup></SelectContent>
        </Select>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUpIcon className="size-4" /> Доходы</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(summary.totalIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingDownIcon className="size-4" /> Расходы</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(summary.totalExpenses)}</div>
            <div className="text-xs text-muted-foreground mt-1">постоянные {formatCurrency(summary.totalConstantExpenses)} · проектные {formatCurrency(summary.totalProjectExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><ScaleIcon className="size-4" /> Прибыль / убыток</div>
            <div className={`text-2xl font-bold mt-1 ${summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(summary.netProfit)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">Маржа</div>
            <div className="text-2xl font-bold mt-1">{summary.marginPct}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Доходы по статьям */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Доходы по статьям</CardTitle></CardHeader>
          <CardContent>
            {data.income.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Нет доходов за период</p>
            ) : (
              <ArticleTable rows={data.income} positive />
            )}
          </CardContent>
        </Card>

        {/* Постоянные расходы */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Постоянные расходы</CardTitle>
              <Badge variant="secondary">орг-учёт</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {data.constantExpenses.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Нет постоянных расходов за период</p>
            ) : (
              <ArticleTable rows={data.constantExpenses} positive={false} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Проектные расходы */}
      {data.projectExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Проектные расходы</CardTitle>
              <Badge variant="outline">по проектам</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ArticleTable rows={data.projectExpenses} positive={false} />
          </CardContent>
        </Card>
      )}

      {/* Прикидка налога УСН */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Прикидка налога УСН 15%</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Налоговая база (Д−Р)</div>
              <div className="font-medium mt-1">{formatCurrency(estimatedUsnTax.base)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">УСН 15% от (Д−Р)</div>
              <div className="font-medium mt-1">{formatCurrency(estimatedUsnTax.tax15)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Минимум 1% от дохода</div>
              <div className="font-medium mt-1">{formatCurrency(estimatedUsnTax.min1pct)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">К уплате (max)</div>
              <div className="font-bold mt-1">{formatCurrency(estimatedUsnTax.applicable)}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Ориентировочный расчёт для принятия решений. Учёт ведётся в 1С отдельно.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ArticleTable({ rows, positive }: { rows: ArticleRow[]; positive: boolean }) {
  return (
    <div className="space-y-1">
      {rows.map((r) => (
        <div key={r.categoryId} className="flex items-center justify-between text-sm py-1">
          <span className="min-w-0">
            <span className="truncate">{r.categoryName}</span>
            <span className="text-muted-foreground text-xs ml-2">({r.transactionCount})</span>
          </span>
          <span className={`font-medium shrink-0 ml-2 ${positive ? "text-green-600" : "text-red-600"}`}>
            {positive ? "+" : "−"}{formatCurrency(r.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}
