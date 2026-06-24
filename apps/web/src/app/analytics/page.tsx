"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, DollarSignIcon, UsersIcon, BarChart3Icon, ShoppingCartIcon, WalletIcon } from "lucide-react"

import { parseJson, ApiClientError } from "@/lib/api/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardData {
  finance: any
  funnel: any
  margin: any
  team: any
  procurement: any
}

const PERIODS = [{ v: "3m", l: "3 months" }, { v: "6m", l: "6 months" }, { v: "12m", l: "12 months" }, { v: "all", l: "All time" }]

function f(a: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(a)
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState("all")

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = `period=${period}`
      const [financeRes, funnelRes, marginRes, teamRes, procRes] = await Promise.all([
        fetch(`/api/finance/summary`),
        fetch(`/api/analytics/funnel?${params}`),
        fetch(`/api/analytics/margin?${params}&limit=5`),
        fetch(`/api/analytics/team-performance?${params}`),
        fetch(`/api/analytics/procurement-metrics?${params}`),
      ])

      const parse = async (res: Response, label: string) => {
        if (!res.ok) return null
        try { return (await parseJson<any>(res)).data } catch { return null }
      }

      const [finance, funnel, margin, team, procurement] = await Promise.all([
        parse(financeRes, 'finance'),
        parse(funnelRes, 'funnel'),
        parse(marginRes, 'margin'),
        parse(teamRes, 'team'),
        parse(procRes, 'procurement'),
      ])

      setData({ finance, funnel, margin, team, procurement })
    } catch (err) { setError("Failed to load dashboard.") }
    finally { setLoading(false) }
  }, [period])

  useEffect(() => { fetchAll() }, [fetchAll])

  if (loading) return <div className="container mx-auto p-6 flex justify-center py-12"><RefreshCwIcon className="size-6 animate-spin text-muted-foreground" /><span className="ml-2 text-muted-foreground">Loading dashboard...</span></div>
  if (error) return <div className="container mx-auto p-6"><Card><CardContent className="pt-6"><div className="flex flex-col items-center gap-3 py-8"><p className="text-destructive">{error}</p><Button variant="outline" onClick={fetchAll}><RefreshCwIcon className="size-4" /><span className="ml-1.5">Retry</span></Button></div></CardContent></Card></div>

  const fData = data?.finance
  const fuData = data?.funnel
  const mData = data?.margin
  const tData = data?.team
  const pData = data?.procurement

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Key business metrics at a glance</p>
        </div>
        <Select value={period} onValueChange={v => { if (v) setPeriod(v) }}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{PERIODS.map(p => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectGroup></SelectContent></Select>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <WalletIcon className="size-5 mx-auto mb-1 text-muted-foreground" />
            <div className={`text-xl font-bold ${(fData?.totals?.balance ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>{f(fData?.totals?.balance ?? 0)}</div>
            <div className="text-xs text-muted-foreground">Balance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUpIcon className="size-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xl font-bold text-green-600">{f(fData?.totals?.income ?? 0)}</div>
            <div className="text-xs text-muted-foreground">Income</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <ShoppingCartIcon className="size-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xl font-bold text-red-600">{f(fData?.totals?.expense ?? 0)}</div>
            <div className="text-xs text-muted-foreground">Expense</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <BarChart3Icon className="size-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xl font-bold">{fuData?.summary?.totalDeals ?? "—"}</div>
            <div className="text-xs text-muted-foreground">Active Deals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <UsersIcon className="size-5 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xl font-bold">{tData?.summary?.managerCount ?? "—"}</div>
            <div className="text-xs text-muted-foreground">Team Members</div>
          </CardContent>
        </Card>
      </div>

      {/* Widget Row 1: Funnel + Margin */}
      <div className="grid grid-cols-2 gap-6">
        {/* Mini Funnel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Sales Funnel</CardTitle>
            <Link href="/analytics/funnel"><Button variant="ghost" size="sm">Details →</Button></Link>
          </CardHeader>
          <CardContent>
            {fuData?.stages?.length > 0 ? (
              <div className="space-y-1.5">
                {fuData.stages.slice(0, 5).map((s: any, i: number) => {
                  const maxCount = Math.max(...(fuData.stages.map((st: any) => st.dealCount) || [1]), 1)
                  const w = Math.max((s.dealCount / maxCount) * 100, 8)
                  return (
                    <div key={s.stageId} className="flex items-center gap-2">
                      <span className="w-20 text-xs text-right shrink-0 truncate">{s.stageName}</span>
                      <div className="flex-1 h-5 bg-blue-400 rounded-r-sm" style={{ width: `${w}%` }} />
                      <span className="text-xs font-medium w-8">{s.dealCount}</span>
                    </div>
                  )
                })}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-2">No data</p>}
          </CardContent>
        </Card>

        {/* Mini Margin */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Project P&L</CardTitle>
            <Link href="/analytics/margin"><Button variant="ghost" size="sm">Details →</Button></Link>
          </CardHeader>
          <CardContent>
            {mData?.summary ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Total Revenue:</span><span className="font-medium">{f(mData.summary.totalRevenue)}</span></div>
                <div className="flex justify-between"><span>Total Profit:</span><span className={`font-medium ${mData.summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{f(mData.summary.totalProfit)}</span></div>
                <div className="flex justify-between"><span>Avg Margin:</span><Badge variant={mData.summary.avgMargin >= 20 ? "default" : "secondary"}>{mData.summary.avgMargin}%</Badge></div>
                <div className="flex justify-between"><span>Profitable / Unprofitable:</span><span>{mData.summary.profitableCount} / {mData.summary.unprofitableCount}</span></div>
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-2">No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Widget Row 2: Team + Procurement */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Team Performance</CardTitle>
            <Link href="/analytics/team"><Button variant="ghost" size="sm">Details →</Button></Link>
          </CardHeader>
          <CardContent>
            {tData?.managers?.length > 0 ? (
              <div className="space-y-1.5">
                {tData.managers.slice(0, 5).map((m: any) => (
                  <div key={m.userId} className="flex items-center justify-between text-sm border-b pb-1">
                    <span className="truncate">{m.userName}</span>
                    <span className="text-muted-foreground">{m.dealCount} deals · {f(m.totalAmount)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-2">No data</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Procurement</CardTitle>
            <Link href="/analytics/procurement"><Button variant="ghost" size="sm">Details →</Button></Link>
          </CardHeader>
          <CardContent>
            {pData?.summary ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Total Spend:</span><span className="font-medium">{f(pData.summary.totalProcurementSpend)}</span></div>
                <div className="flex justify-between"><span>Purchase Requests:</span><span>{pData.summary.purchaseRequestCount}</span></div>
                <div className="flex justify-between"><span>Invoices:</span><span>{pData.summary.invoiceCount}</span></div>
                <div className="flex justify-between"><span>Deliveries:</span><span>{pData.summary.deliveryCount}</span></div>
              </div>
            ) : <p className="text-sm text-muted-foreground text-center py-2">No data</p>}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader><CardTitle className="text-base">Detailed Reports</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {[
              { href: "/analytics/funnel", label: "Sales Funnel", desc: "Conversion by stage" },
              { href: "/analytics/margin", label: "P&L / Margin", desc: "Project profitability" },
              { href: "/analytics/team", label: "Team", desc: "Manager metrics" },
              { href: "/analytics/procurement", label: "Procurement", desc: "Supply chain KPIs" },
            ].map(link => (
              <Link key={link.href} href={link.href} className="block rounded-lg border p-3 hover:bg-muted transition-colors">
                <div className="font-medium text-sm">{link.label}</div>
                <div className="text-xs text-muted-foreground">{link.desc}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
