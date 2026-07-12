"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCwIcon, BanknoteIcon } from "lucide-react"

import { ApiClientError, parseJson } from "@/lib/api/shared"
import { formatCurrency, formatMonthLabel } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface MonthlyRow {
  month: string
  planned: { income: number; expense: number; net: number }
  actual: { income: number; expense: number; net: number }
}
interface CashflowData {
  period: string
  monthly: MonthlyRow[]
  summary: {
    planned: { income: number; expense: number; net: number }
    actual: { income: number; expense: number; net: number }
    monthCount: number
  }
}

function currentQuarter(): string {
  const d = new Date()
  const q = Math.floor(d.getMonth() / 3) + 1
  return `${d.getFullYear()}-Q${q}`
}

const PERIODS = [
  { v: "this-month", l: "Этот месяц" },
  { v: "this-q", l: "Этот квартал" },
  { v: "prev-q", l: "Прошлый квартал" },
  { v: "6m", l: "6 месяцев" },
  { v: "12m", l: "12 месяцев" },
]

function prevQuarter(): string {
  const d = new Date()
  const q = Math.floor(d.getMonth() / 3) + 1
  const prevQ = q === 1 ? 4 : q - 1
  const y = q === 1 ? d.getFullYear() - 1 : d.getFullYear()
  return `${y}-Q${prevQ}`
}

function thisMonthStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export default function CashflowPage() {
  const [data, setData] = useState<CashflowData | null>(null)
  const [period, setPeriod] = useState("this-q")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCashflow = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const serverPeriod =
        period === "this-month" ? thisMonthStr()
        : period === "this-q" ? currentQuarter()
        : period === "prev-q" ? prevQuarter()
        : period
      const res = await fetch(`/api/accounting/cashflow?period=${serverPeriod}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await parseJson<{ data: CashflowData }>(res)
      setData(json.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить ДДС.")
    } finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchCashflow() }, [fetchCashflow])

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
              <Button variant="outline" onClick={fetchCashflow}>
                <RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { summary } = data

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BanknoteIcon className="size-6" /> ДДС — движение денежных средств
        </h1>
        <Select value={period} onValueChange={(v) => { if (v) setPeriod(v) }} items={Object.fromEntries(PERIODS.map((p) => [p.v, p.l]))}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>
            {PERIODS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}
          </SelectGroup></SelectContent>
        </Select>
      </div>

      {/* Итоги план/факт */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">План</h3>
              <Badge variant="outline">когда придут/уйдут</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <div className="text-muted-foreground">Приток</div>
                <div className="font-bold text-green-600 mt-1">{formatCurrency(summary.planned.income)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Отток</div>
                <div className="font-bold text-red-600 mt-1">{formatCurrency(summary.planned.expense)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Сальдо</div>
                <div className={`font-bold mt-1 ${summary.planned.net >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(summary.planned.net)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Факт</h3>
              <Badge variant="secondary">по факту движения</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
              <div>
                <div className="text-muted-foreground">Приток</div>
                <div className="font-bold text-green-600 mt-1">{formatCurrency(summary.actual.income)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Отток</div>
                <div className="font-bold text-red-600 mt-1">{formatCurrency(summary.actual.expense)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Сальдо</div>
                <div className={`font-bold mt-1 ${summary.actual.net >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(summary.actual.net)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* По месяцам */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium" rowSpan={2}>Месяц</th>
                <th className="p-3 font-medium text-center" colSpan={3}>План</th>
                <th className="p-3 font-medium text-center" colSpan={3}>Факт</th>
              </tr>
              <tr className="border-b text-muted-foreground text-xs">
                <th className="p-2 font-medium text-right">приток</th>
                <th className="p-2 font-medium text-right">отток</th>
                <th className="p-2 font-medium text-right">сальдо</th>
                <th className="p-2 font-medium text-right">приток</th>
                <th className="p-2 font-medium text-right">отток</th>
                <th className="p-2 font-medium text-right">сальдо</th>
              </tr>
            </thead>
            <tbody>
              {data.monthly.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Нет месяцев в периоде</td></tr>
              )}
              {data.monthly.map((m) => (
                <tr key={m.month} className="border-b last:border-0">
                  <td className="p-3 font-medium">{formatMonthLabel(m.month)}</td>
                  <td className="p-2 text-right text-green-600">{formatCurrency(m.planned.income)}</td>
                  <td className="p-2 text-right text-red-600">{formatCurrency(m.planned.expense)}</td>
                  <td className={`p-2 text-right ${m.planned.net >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(m.planned.net)}</td>
                  <td className="p-2 text-right text-green-600">{formatCurrency(m.actual.income)}</td>
                  <td className="p-2 text-right text-red-600">{formatCurrency(m.actual.expense)}</td>
                  <td className={`p-2 text-right font-medium ${m.actual.net >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(m.actual.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        ДДС отражает момент движения денег и не совпадает с P&L (начисления). План — плановые/запланированные платежи; факт — подтверждённые транзакции.
      </p>
    </div>
  )
}
