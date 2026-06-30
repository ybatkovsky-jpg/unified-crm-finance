"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, BarChart3Icon } from "lucide-react"

import { parseJson, ApiClientError } from "@/lib/api/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProjectPnL {
  projectId: string; projectName: string; status: string
  revenue: number; cost: number; profit: number; margin: number
  marginTargetPct: number; lowMargin: boolean
  income: number; expense: number; budgeted: number; budgetUsage: number
  transactionCount: number
}

interface MarginData {
  projects: ProjectPnL[]
  top5: ProjectPnL[]
  bottom5: ProjectPnL[]
  lowMarginAlerts: Array<{ projectId: string; projectName: string; margin: number; target: number; deficit: number }>
  marginByStatus?: {
    closed: { count: number; revenue: number; profit: number; avgMargin: number }
    open: { count: number; revenue: number; profit: number; avgMargin: number }
  }
  summary: {
    totalRevenue: number; totalCost: number; totalProfit: number; avgMargin: number
    projectCount: number; profitableCount: number; unprofitableCount: number
  }
  distribution: { negative: number; low: number; medium: number; good: number; excellent: number }
}

function f(a: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(a)
}
function pct(v: number): string { return `${v}%` }

const PERIODS = [{ v: "3m", l: "3 мес." }, { v: "6m", l: "6 мес." }, { v: "12m", l: "12 мес." }, { v: "all", l: "Всё время" }]

export default function MarginPage() {
  const [data, setData] = useState<MarginData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState("all")
  const [sortBy, setSortBy] = useState("profit")

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/analytics/margin?period=${period}&sortBy=${sortBy}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData((await parseJson<{ data: MarginData }>(res)).data)
    } catch (err) { setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить.") }
    finally { setLoading(false) }
  }, [period, sortBy])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="container mx-auto p-6 flex justify-center py-12"><RefreshCwIcon className="size-6 animate-spin text-muted-foreground" /><span className="ml-2 text-muted-foreground">Загрузка...</span></div>
  if (error || !data) return <div className="container mx-auto p-6"><Card><CardContent className="pt-6"><div className="flex flex-col items-center gap-3 py-8"><p className="text-destructive">{error || "Нет данных"}</p><Button variant="outline" onClick={fetchData}><RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span></Button></div></CardContent></Card></div>

  const { summary, top5, bottom5, projects, distribution, lowMarginAlerts, marginByStatus } = data

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">P&L / Анализ маржинальности</h1>
        <div className="flex gap-2">
          <Select value={period} onValueChange={v => { if (v) setPeriod(v) }}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{PERIODS.map(p => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectGroup></SelectContent></Select>
          <Select value={sortBy} onValueChange={v => { if (v) setSortBy(v) }}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="profit">По прибыли</SelectItem><SelectItem value="margin">По марже %</SelectItem><SelectItem value="revenue">По выручке</SelectItem></SelectGroup></SelectContent></Select>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-4">
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{summary.projectCount}</div><div className="text-sm text-muted-foreground">Проектов</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-green-600">{f(summary.totalRevenue)}</div><div className="text-sm text-muted-foreground">Выручка</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-red-600">{f(summary.totalCost)}</div><div className="text-sm text-muted-foreground">Расходы</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className={`text-2xl font-bold ${summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{f(summary.totalProfit)}</div><div className="text-sm text-muted-foreground">Прибыль</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{pct(summary.avgMargin)}</div><div className="text-sm text-muted-foreground">Ср. маржа</div></CardContent></Card>
      </div>

      {/* Distribution + Profit/Loss split */}
      <div className="grid grid-cols-2 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2 text-sm mb-1"><TrendingUpIcon className="size-4 text-green-600" />Прибыльных: <span className="font-bold">{summary.profitableCount}</span></div><div className="flex items-center gap-2 text-sm"><TrendingDownIcon className="size-4 text-red-600" />Убыточных: <span className="font-bold">{summary.unprofitableCount}</span></div></CardContent></Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium mb-2">Распределение маржи</div>
            <div className="flex h-6 rounded-full overflow-hidden">
              {distribution.negative > 0 && <div className="bg-red-500 flex items-center justify-center text-xs text-white" style={{ width: `${Math.max((distribution.negative / summary.projectCount) * 100, 8)}%` }}>{distribution.negative}</div>}
              {distribution.low > 0 && <div className="bg-yellow-500 flex items-center justify-center text-xs text-white" style={{ width: `${Math.max((distribution.low / summary.projectCount) * 100, 8)}%` }}>{distribution.low}</div>}
              {distribution.medium > 0 && <div className="bg-blue-500 flex items-center justify-center text-xs text-white" style={{ width: `${Math.max((distribution.medium / summary.projectCount) * 100, 8)}%` }}>{distribution.medium}</div>}
              {distribution.good > 0 && <div className="bg-green-500 flex items-center justify-center text-xs text-white" style={{ width: `${Math.max((distribution.good / summary.projectCount) * 100, 8)}%` }}>{distribution.good}</div>}
              {distribution.excellent > 0 && <div className="bg-emerald-600 flex items-center justify-center text-xs text-white" style={{ width: `${Math.max((distribution.excellent / summary.projectCount) * 100, 8)}%` }}>{distribution.excellent}</div>}
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground mt-2">
              <span>🔴 &lt;0%</span><span>🟡 0-10%</span><span>🔵 10-20%</span><span>🟢 20-30%</span><span>🟩 &gt;30%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Profitable + Bottom 5 Unprofitable */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-green-600 flex items-center gap-2"><TrendingUpIcon className="size-5" />Топ-5 прибыльных</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">{top5.map(p => (
              <div key={p.projectId} className="flex items-center justify-between text-sm border-b pb-2">
                <div><span className="font-medium">{p.projectName}</span><Badge variant="outline" className="ml-2 text-xs">{p.status}</Badge></div>
                <div className="text-right"><span className="text-green-600 font-medium">{f(p.profit)}</span><br /><span className="text-xs text-muted-foreground">маржа: {pct(p.margin)}</span></div>
              </div>
            ))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><TrendingDownIcon className="size-5" />Анти-топ 5 — требуют внимания</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">{bottom5.filter(p => p.profit < 0).slice(0, 5).map(p => (
              <div key={p.projectId} className="flex items-center justify-between text-sm border-b pb-2">
                <div><span className="font-medium">{p.projectName}</span><Badge variant="outline" className="ml-2 text-xs">{p.status}</Badge></div>
                <div className="text-right"><span className="text-red-600 font-medium">{f(p.profit)}</span><br /><span className="text-xs text-muted-foreground">маржа: {pct(p.margin)}</span></div>
              </div>
            ))}</div>
          </CardContent>
        </Card>
      </div>

      {/* PLAT-04: сплит маржи — текущие vs закрытые */}
      {marginByStatus && (marginByStatus.closed.count > 0 || marginByStatus.open.count > 0) && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Маржа: текущие vs закрытые</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUpIcon className="size-4" /> В работе
                  <Badge variant="outline">{marginByStatus.open.count}</Badge>
                </div>
                <div>Выручка: <span className="font-medium">{f(marginByStatus.open.revenue)}</span></div>
                <div>Прибыль: <span className={`font-medium ${marginByStatus.open.profit >= 0 ? "text-green-600" : "text-red-600"}`}>{f(marginByStatus.open.profit)}</span></div>
                <div>Ср. маржа: <span className="font-medium">{pct(marginByStatus.open.avgMargin)}</span></div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BarChart3Icon className="size-4" /> Закрытые
                  <Badge variant="outline">{marginByStatus.closed.count}</Badge>
                </div>
                <div>Выручка: <span className="font-medium">{f(marginByStatus.closed.revenue)}</span></div>
                <div>Прибыль: <span className={`font-medium ${marginByStatus.closed.profit >= 0 ? "text-green-600" : "text-red-600"}`}>{f(marginByStatus.closed.profit)}</span></div>
                <div>Ср. маржа: <span className="font-medium">{pct(marginByStatus.closed.avgMargin)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low-margin alerts (FIN-04) */}
      {lowMarginAlerts.length > 0 && (
        <Card className="border-amber-500">
          <CardHeader>
            <CardTitle className="text-amber-600 flex items-center gap-2">
              <TrendingDownIcon className="size-5" />
              Низкомаржинальные проекты ({lowMarginAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowMarginAlerts.slice(0, 10).map((a) => (
                <div key={a.projectId} className="flex items-center justify-between text-sm border-b pb-2">
                  <a href={`/projects/${a.projectId}`} className="font-medium text-primary hover:underline">
                    {a.projectName}
                  </a>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{pct(a.margin)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      цель {pct(a.target)}, недостача {pct(a.deficit)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Table */}
      <Card>
        <CardHeader><CardTitle>Все проекты</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2">Проект</th><th className="text-right py-2">Выручка</th><th className="text-right py-2">Расходы</th><th className="text-right py-2">Прибыль</th><th className="text-right py-2">Маржа</th><th className="text-right py-2">Бюджет</th><th className="text-right py-2">Тx</th>
              </tr></thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.projectId} className="border-b hover:bg-muted/50">
                    <td className="py-2 font-medium">{p.projectName}</td>
                    <td className="py-2 text-right">{f(p.revenue)}</td>
                    <td className="py-2 text-right text-red-600">{f(p.cost)}</td>
                    <td className={`py-2 text-right font-medium ${p.profit >= 0 ? "text-green-600" : "text-red-600"}`}>{f(p.profit)}</td>
                    <td className="py-2 text-right"><Badge variant={p.margin >= 20 ? "default" : p.margin < 0 ? "destructive" : "secondary"}>{pct(p.margin)}</Badge></td>
                    <td className="py-2 text-right text-muted-foreground">{p.budgetUsage > 0 ? `${p.budgetUsage}%` : "—"}</td>
                    <td className="py-2 text-right text-muted-foreground">{p.transactionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
