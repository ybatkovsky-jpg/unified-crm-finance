"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, TrendingUpIcon, TrendingDownIcon, WalletIcon, CalendarIcon, BarChart3Icon } from "lucide-react"

import { ApiClientError, parseJson } from "@/lib/api/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FinanceSummary {
  totals: { income: number; expense: number; balance: number }
  budgets: { totalBudgeted: number; budgetCount: number; budgetHealth: number }
  payments: {
    upcoming: Array<{
      id: string; date: string; amount: number; type: string
      status: string; description: string | null
      counterpartyName: string | null; projectName: string | null; dueDate: string | null
    }>
    upcomingTotal: number
  }
  transactions: {
    recent: Array<{
      id: string; date: string; amount: number; type: string
      description: string | null; status: string
      categoryName: string | null; projectName: string | null
    }>
    confirmed: number; pending: number; total: number
  }
  categoryBreakdown: Array<{
    categoryId: string; categoryName: string; type: string
    totalAmount: number; transactionCount: number
  }>
}

function formatCurrency(a: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(a)
}
function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("ru-RU")
}

export default function FinanceDashboardPage() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/finance/summary")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await parseJson<{ data: FinanceSummary }>(res)
      setSummary(json.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить панель.")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-12"><RefreshCwIcon className="size-6 animate-spin text-muted-foreground" /><span className="ml-2 text-muted-foreground">Загрузка панели...</span></div>
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="container mx-auto p-6">
        <Card><CardContent className="pt-6"><div className="flex flex-col items-center gap-3 py-8"><p className="text-destructive">{error || "Не удалось загрузить"}</p><Button variant="outline" onClick={fetchSummary}><RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span></Button></div></CardContent></Card>
      </div>
    )
  }

  const { totals, budgets, payments, transactions, categoryBreakdown } = summary

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Финансовая панель</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><WalletIcon className="size-4" /> Balance</div>
            <div className={`text-2xl font-bold mt-1 ${totals.balance >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(totals.balance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingUpIcon className="size-4" /> Income</div>
            <div className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totals.income)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><TrendingDownIcon className="size-4" /> Expense</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totals.expense)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm"><BarChart3Icon className="size-4" /> Budgets</div>
            <div className="text-2xl font-bold mt-1">{budgets.budgetCount}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(budgets.totalBudgeted)} total</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <Link href="/finance/transactions"><Button variant="outline" size="sm">View All</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.recent.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">Транзакций пока нет</p>
            ) : (
              <div className="space-y-2">
                {transactions.recent.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <Link href={`/finance/transactions/${tx.id}`} className="text-primary hover:underline truncate block">{tx.description || tx.id.slice(0, 8)}</Link>
                      <span className="text-muted-foreground text-xs">{formatDate(tx.date)} · {tx.categoryName}</span>
                    </div>
                    <span className={`font-medium shrink-0 ml-2 ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "income" ? "+" : "−"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Upcoming Payments</CardTitle>
              <Link href="/finance/payments"><Button variant="outline" size="sm">View All</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {payments.upcoming.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No upcoming payments</p>
            ) : (
              <div className="space-y-2">
                {payments.upcoming.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <span className="truncate block">{p.description || p.counterpartyName || "Payment"}</span>
                      <span className="text-muted-foreground text-xs">
                        {p.dueDate ? `Due: ${formatDate(p.dueDate)}` : formatDate(p.date)}
                        <Badge variant="outline" className="ml-1 text-[10px] px-1">{p.status}</Badge>
                      </span>
                    </div>
                    <span className="font-medium shrink-0 ml-2">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            {payments.upcomingTotal > 0 && (
              <div className="mt-3 pt-3 border-t text-sm font-medium text-right">{formatCurrency(payments.upcomingTotal)} upcoming</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Category Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categoryBreakdown.map(cat => (
                <div key={cat.categoryId} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={cat.type === "income" ? "default" : "secondary"}>{cat.type}</Badge>
                    <Link href={`/finance/categories/${cat.categoryId}`} className="hover:underline">{cat.categoryName}</Link>
                    <span className="text-muted-foreground text-xs">({cat.transactionCount} tx)</span>
                  </div>
                  <span className="font-medium">{formatCurrency(cat.totalAmount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
