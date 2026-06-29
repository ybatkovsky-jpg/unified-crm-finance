"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, ScaleIcon,
  FileBarChartIcon, GitCompareArrowsIcon, BanknoteIcon, TagsIcon, ArrowRightIcon,
} from "lucide-react"

import { ApiClientError, parseJson } from "@/lib/api/shared"
import { formatCurrency, formatMonthLabel } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PnlSummary {
  summary: {
    totalIncome: number
    totalConstantExpenses: number
    totalProjectExpenses: number
    totalExpenses: number
    netProfit: number
    marginPct: number
  }
  constantExpenses: Array<{ categoryId: string; categoryName: string; amount: number }>
  estimatedUsnTax: { applicable: number }
}
interface PlanFactSummary {
  period: string
  summary: { totalPlanned: number; totalActual: number; totalVariance: number; percentUsed: number }
}
interface CashflowSummary {
  summary: {
    planned: { net: number }
    actual: { net: number }
  }
  monthly: Array<{ month: string; actual: { net: number } }>
}

const PERIOD = "3m"

export default function AccountingOverviewPage() {
  const [pnl, setPnl] = useState<PnlSummary | null>(null)
  const [planFact, setPlanFact] = useState<PlanFactSummary | null>(null)
  const [cashflow, setCashflow] = useState<CashflowSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [pnlRes, planFactRes, cashflowRes] = await Promise.allSettled([
        fetch(`/api/accounting/pnl?period=${PERIOD}`).then((r) => r.ok ? parseJson<{ data: PnlSummary }>(r) : null),
        fetch(`/api/accounting/plan-fact?scope=org`).then((r) => r.ok ? parseJson<{ data: PlanFactSummary }>(r) : null),
        fetch(`/api/accounting/cashflow?period=this-q`).then((r) => r.ok ? parseJson<{ data: CashflowSummary }>(r) : null),
      ])
      if (pnlRes.status === "fulfilled" && pnlRes.value) setPnl(pnlRes.value.data)
      if (planFactRes.status === "fulfilled" && planFactRes.value) setPlanFact(planFactRes.value.data)
      if (cashflowRes.status === "fulfilled" && cashflowRes.value) setCashflow(cashflowRes.value.data)
      if (pnlRes.status === "rejected") throw pnlRes.reason
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить обзор учёта.")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

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

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={fetchAll}>
                <RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const s = pnl?.summary
  const topConstant = [...(pnl?.constantExpenses ?? [])]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Управленческий учёт</h1>
          <p className="text-muted-foreground text-sm">Здоровье организации — доходы, расходы, прибыль, план/факт</p>
        </div>
        <Link href="/accounting/pnl">
          <Button variant="outline" size="sm"><FileBarChartIcon className="size-4" />Детальный P&L</Button>
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUpIcon className="size-4" /> Доходы ({PERIOD})</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(s?.totalIncome ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingDownIcon className="size-4" /> Расходы</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(s?.totalExpenses ?? 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              пост. {formatCurrency(s?.totalConstantExpenses ?? 0)} · проектн. {formatCurrency(s?.totalProjectExpenses ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><ScaleIcon className="size-4" /> Прибыль / убыток</div>
            <div className={`text-2xl font-bold mt-1 ${(s?.netProfit ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(s?.netProfit ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">Сальдо ДДС (факт)</div>
            <div className={`text-2xl font-bold mt-1 ${(cashflow?.summary.actual.net ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(cashflow?.summary.actual.net ?? 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">квартал</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* План/факт за месяц */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">План / факт за месяц</CardTitle>
              <Link href="/accounting/plan-fact"><Button variant="outline" size="sm">Подробнее</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {planFact ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">План</div>
                    <div className="font-medium mt-1">{formatCurrency(planFact.summary.totalPlanned)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Факт</div>
                    <div className="font-medium mt-1">{formatCurrency(planFact.summary.totalActual)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Отклонение</div>
                    <div className={`font-medium mt-1 ${planFact.summary.totalVariance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(planFact.summary.totalVariance)}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Освоение плана: <span className={planFact.summary.percentUsed > 100 ? "text-red-600 font-medium" : "font-medium"}>{planFact.summary.percentUsed}%</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">Нет данных</p>
            )}
          </CardContent>
        </Card>

        {/* Топ постоянных расходов */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Топ постоянных расходов</CardTitle>
              <Badge variant="secondary">{PERIOD}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {topConstant.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Нет расходов за период</p>
            ) : (
              <div className="space-y-1">
                {topConstant.map((r) => (
                  <div key={r.categoryId} className="flex items-center justify-between text-sm py-1">
                    <span className="truncate">{r.categoryName}</span>
                    <span className="text-red-600 font-medium ml-2">{formatCurrency(r.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ДДС по месяцам (факт) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">ДДС по месяцам (факт)</CardTitle>
            <Link href="/accounting/cashflow"><Button variant="outline" size="sm">Подробнее</Button></Link>
          </div>
        </CardHeader>
        <CardContent>
          {cashflow && cashflow.monthly.length > 0 ? (
            <div className="space-y-1">
              {cashflow.monthly.map((m) => (
                <div key={m.month} className="flex items-center justify-between text-sm py-1">
                  <span className="text-muted-foreground">{formatMonthLabel(m.month)}</span>
                  <span className={`font-medium ${m.actual.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(m.actual.net)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-4 text-center">Нет данных по ДДС</p>
          )}
        </CardContent>
      </Card>

      {/* Прикидка налога */}
      {pnl?.estimatedUsnTax && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-muted-foreground text-sm">Прикидка налога УСН 15%</div>
                <div className="text-xl font-bold mt-1">{formatCurrency(pnl.estimatedUsnTax.applicable)}</div>
              </div>
              <Badge variant="outline">ориентир</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Быстрые ссылки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickLink href="/accounting/pnl" icon={FileBarChartIcon} label="P&L" desc="Прибыли и убытки" />
        <QuickLink href="/accounting/plan-fact" icon={GitCompareArrowsIcon} label="План/факт" desc="По статьям" />
        <QuickLink href="/accounting/cashflow" icon={BanknoteIcon} label="ДДС" desc="Движение денег" />
        <QuickLink href="/accounting/articles" icon={TagsIcon} label="Статьи" desc="12 расходов" />
      </div>
    </div>
  )
}

function QuickLink({ href, icon: Icon, label, desc }: {
  href: string; icon: typeof FileBarChartIcon; label: string; desc: string
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
