"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, TrendingDownIcon } from "lucide-react"

import { parseJson, ApiClientError } from "@/lib/api/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface FunnelStage {
  stageId: string; stageName: string; order: number
  dealCount: number; totalAmount: number; avgAmount: number
  conversionRate: number; stageToStageConversion: number | null
}

interface FunnelData {
  stages: FunnelStage[]
  summary: {
    totalDeals: number; totalAmount: number; overallConversion: number
    firstStage: string; lastStage: string; pipelineName: string
    totalLost?: number
  }
  lossReasonBreakdown?: Array<{ reason: string; label: string; count: number; amount: number }>
}

function formatCurrency(a: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(a)
}

const PERIODS = [
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "all", label: "All time" },
]

// Color palette for funnel bars
const FUNNEL_COLORS = [
  "bg-blue-500", "bg-cyan-500", "bg-teal-500", "bg-emerald-500",
  "bg-green-500", "bg-lime-500", "bg-yellow-500", "bg-amber-500",
]

export default function SalesFunnelPage() {
  const [funnel, setFunnel] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState("all")

  const fetchFunnel = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/analytics/funnel?period=${period}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await parseJson<{ data: FunnelData }>(res)
      setFunnel(json.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить funnel data.")
    } finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchFunnel() }, [fetchFunnel])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-12"><RefreshCwIcon className="size-6 animate-spin text-muted-foreground" /><span className="ml-2 text-muted-foreground">Загрузка funnel...</span></div>
      </div>
    )
  }

  const maxDealCount = funnel ? Math.max(...funnel.stages.map(s => s.dealCount), 1) : 1

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales Funnel</h1>
          {funnel && <p className="text-sm text-muted-foreground mt-1">{funnel.summary.pipelineName}</p>}
        </div>
        <Select value={period} onValueChange={v => { if (v) setPeriod(v) }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>
            {PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectGroup></SelectContent>
        </Select>
      </div>

      {error && (
        <Card><CardContent className="pt-6"><div className="flex flex-col items-center gap-3 py-8"><p className="text-destructive">{error}</p><Button variant="outline" onClick={fetchFunnel}><RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span></Button></div></CardContent></Card>
      )}

      {funnel && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{funnel.summary.totalDeals}</div><div className="text-sm text-muted-foreground">Total Deals</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{formatCurrency(funnel.summary.totalAmount)}</div><div className="text-sm text-muted-foreground">Total Amount</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{funnel.summary.overallConversion}%</div><div className="text-sm text-muted-foreground">Overall Conversion</div><div className="text-xs text-muted-foreground">{funnel.summary.firstStage} → {funnel.summary.lastStage}</div></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{funnel.stages.length}</div><div className="text-sm text-muted-foreground">Stages</div></CardContent></Card>
          </div>

          {/* Funnel Visualization */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDownIcon className="size-5" />Funnel Stages</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnel.stages.map((stage, idx) => {
                  const widthPct = Math.max((stage.dealCount / maxDealCount) * 100, 8)
                  const color = FUNNEL_COLORS[idx % FUNNEL_COLORS.length]
                  return (
                    <div key={stage.stageId}>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-32 text-sm font-medium text-right shrink-0">{stage.stageName}</div>
                        <div className="flex-1">
                          <div
                            className={`h-8 ${color} rounded-r-md flex items-center justify-end px-3 min-w-[60px] transition-all`}
                            style={{ width: `${widthPct}%` }}
                          >
                            <span className="text-white font-semibold text-sm">{stage.dealCount}</span>
                          </div>
                        </div>
                        <div className="w-36 text-xs text-muted-foreground shrink-0">
                          {formatCurrency(stage.totalAmount)}
                        </div>
                      </div>
                      {idx < funnel.stages.length - 1 && (
                        <div className="flex items-center gap-3 ml-[140px] text-xs text-muted-foreground mb-2">
                          <span>
                            Conversion to {funnel.stages[idx + 1].stageName}:{" "}
                            <Badge variant="outline" className="ml-1">{stage.stageToStageConversion ?? 0}%</Badge>
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader><CardTitle>Stage Details</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Stage</th>
                      <th className="text-right py-2 font-medium">Deals</th>
                      <th className="text-right py-2 font-medium">Total Amount</th>
                      <th className="text-right py-2 font-medium">Avg Amount</th>
                      <th className="text-right py-2 font-medium">Conv. from Lead</th>
                      <th className="text-right py-2 font-medium">Conv. to Next</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funnel.stages.map(stage => (
                      <tr key={stage.stageId} className="border-b">
                        <td className="py-2 font-medium">{stage.stageName}</td>
                        <td className="py-2 text-right">{stage.dealCount}</td>
                        <td className="py-2 text-right">{formatCurrency(stage.totalAmount)}</td>
                        <td className="py-2 text-right">{formatCurrency(stage.avgAmount)}</td>
                        <td className="py-2 text-right">{stage.conversionRate}%</td>
                        <td className="py-2 text-right">{stage.stageToStageConversion !== null ? `${stage.stageToStageConversion}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Причины отказов (PLAT-03) */}
          {funnel.lossReasonBreakdown && funnel.lossReasonBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><TrendingDownIcon className="size-4" /> Причины отказов</CardTitle>
                  <Badge variant="outline">{funnel.summary.totalLost ?? 0} отказов</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {funnel.lossReasonBreakdown.map((r) => {
                    const maxCount = Math.max(...funnel.lossReasonBreakdown!.map((x) => x.count), 1)
                    const pct = Math.round((r.count / maxCount) * 100)
                    return (
                      <div key={r.reason} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{r.label}</span>
                          <span className="text-muted-foreground">
                            {r.count} · {formatCurrency(r.amount)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
