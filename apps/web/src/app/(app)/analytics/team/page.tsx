"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCwIcon, UsersIcon } from "lucide-react"

import { parseJson, ApiClientError } from "@/lib/api/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Manager {
  userId: string; userName: string; dealCount: number; totalAmount: number
  avgAmount: number; conversion: number; interactionCount: number
}

interface TeamData {
  managers: Manager[]
  summary: { totalDeals: number; totalAmount: number; avgConversion: number; managerCount: number }
}

function f(a: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(a)
}

const PERIODS = [{ v: "3m", l: "3 months" }, { v: "6m", l: "6 months" }, { v: "12m", l: "12 months" }, { v: "all", l: "All time" }]

export default function TeamPerformancePage() {
  const [data, setData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState("all")

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/analytics/team-performance?period=${period}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData((await parseJson<{ data: TeamData }>(res)).data)
    } catch (err) { setError(err instanceof ApiClientError ? err.message : "Failed to load.") }
    finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchData() }, [fetchData])

  const maxAmount = data ? Math.max(...data.managers.map(m => m.totalAmount), 1) : 1
  const maxDeals = data ? Math.max(...data.managers.map(m => m.dealCount), 1) : 1

  if (loading) return <div className="container mx-auto p-6 flex justify-center py-12"><RefreshCwIcon className="size-6 animate-spin text-muted-foreground" /><span className="ml-2 text-muted-foreground">Загрузка...</span></div>
  if (error || !data) return <div className="container mx-auto p-6"><Card><CardContent className="pt-6"><div className="flex flex-col items-center gap-3 py-8"><p className="text-destructive">{error || "No data"}</p><Button variant="outline" onClick={fetchData}><RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span></Button></div></CardContent></Card></div>

  const { managers, summary } = data

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Team Performance</h1>
        <Select value={period} onValueChange={v => { if (v) setPeriod(v) }}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{PERIODS.map(p => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectGroup></SelectContent></Select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{summary.managerCount}</div><div className="text-sm text-muted-foreground">Managers</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{summary.totalDeals}</div><div className="text-sm text-muted-foreground">Total Deals</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{f(summary.totalAmount)}</div><div className="text-sm text-muted-foreground">Total Amount</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold">{summary.avgConversion}%</div><div className="text-sm text-muted-foreground">Avg Conversion</div></CardContent></Card>
      </div>

      {/* Amount comparison bar chart */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UsersIcon className="size-5" />Deal Amount by Manager</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {managers.map(m => (
              <div key={m.userId} className="flex items-center gap-3">
                <div className="w-32 text-sm font-medium text-right shrink-0 truncate">{m.userName}</div>
                <div className="flex-1">
                  <div className="h-6 bg-blue-500 rounded-r-md flex items-center justify-end px-2 min-w-[40px]" style={{ width: `${Math.max((m.totalAmount / maxAmount) * 100, 5)}%` }}>
                    <span className="text-white text-xs font-semibold">{f(m.totalAmount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Manager Details</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left py-2">Manager</th><th className="text-right py-2">Deals</th><th className="text-right py-2">Total Amount</th><th className="text-right py-2">Avg Deal</th><th className="text-right py-2">Conversion</th><th className="text-right py-2">Interactions</th>
              </tr></thead>
              <tbody>
                {managers.map(m => (
                  <tr key={m.userId} className="border-b hover:bg-muted/50">
                    <td className="py-2 font-medium">{m.userName}</td>
                    <td className="py-2 text-right font-medium">{m.dealCount}</td>
                    <td className="py-2 text-right">{f(m.totalAmount)}</td>
                    <td className="py-2 text-right text-muted-foreground">{f(m.avgAmount)}</td>
                    <td className="py-2 text-right"><Badge variant={m.conversion >= 50 ? "default" : m.conversion >= 25 ? "secondary" : "outline"}>{m.conversion}%</Badge></td>
                    <td className="py-2 text-right text-muted-foreground">{m.interactionCount}</td>
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
