"use client"

import { useState, useEffect, useCallback } from "react"
import { Scale, Loader2, ArrowLeft, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ApiClientError, parseJson } from "@/lib/api/shared"

interface ReceivableItem {
  projectId: string; projectName: string; externalNumber: string; clientName: string
  contractAmount: number; received: number; amount: number; dueDate: string | null; overdue: boolean
}
interface PayableItem {
  type: "supplier" | "designer"; counterpartyName: string; projectName: string | null
  amount: number; dueDate: string | null; overdue: boolean; refId: string
}
interface DebtData {
  receivables: ReceivableItem[]
  payables: PayableItem[]
  totals: { receivableTotal: number; receivableOverdue: number; payableTotal: number; payableOverdue: number }
}

function f(n: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n)
}
function d(s: string | null): string {
  return s ? new Date(s).toLocaleDateString("ru-RU") : "—"
}

export default function DebtsPage() {
  const [data, setData] = useState<DebtData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/finance/debts", { headers: { "Content-Type": "application/json" } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData((await parseJson<{ data: DebtData }>(res)).data)
    } catch (err) { setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить долги") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return <div className="container mx-auto p-6 flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
  }
  if (error || !data) {
    return <div className="container mx-auto p-6"><Card><CardContent className="pt-6"><p className="text-destructive">{error || "Нет данных"}</p><Button variant="outline" className="mt-2" onClick={fetchData}>Повторить</Button></CardContent></Card></div>
  }

  const { receivables, payables, totals } = data

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Scale className="size-6" /> Долги
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Дебиторская и кредиторская задолженность</p>
        </div>
        <Button variant="outline" render={<a href="/finance"><ArrowLeft className="size-4 mr-1" />К финансам</a>} />
      </div>

      {/* Сводные карточки */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-green-600 flex items-center gap-2"><TrendingUp className="size-5" />Нам должны (дебиторка)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">{f(totals.receivableTotal)}</p>
                <p className="text-xs text-muted-foreground">из {receivables.length} проектов</p>
              </div>
              {totals.receivableOverdue > 0 && (
                <Badge variant="destructive">Просрочка: {f(totals.receivableOverdue)}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><TrendingDown className="size-5" />Мы должны (кредиторка)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">{f(totals.payableTotal)}</p>
                <p className="text-xs text-muted-foreground">{payables.length} обязательств</p>
              </div>
              {totals.payableOverdue > 0 && (
                <Badge variant="destructive">Просрочка: {f(totals.payableOverdue)}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблица дебиторки */}
      <Card>
        <CardHeader><CardTitle>Дебиторская задолженность (клиенты)</CardTitle></CardHeader>
        <CardContent>
          {receivables.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Нет дебиторской задолженности</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left py-2">Проект</th><th className="text-left py-2">Клиент</th>
                  <th className="text-right py-2">Договор</th><th className="text-right py-2">Получено</th>
                  <th className="text-right py-2">Долг</th><th className="text-right py-2">Срок</th>
                </tr></thead>
                <tbody>
                  {receivables.map((r) => (
                    <tr key={r.projectId} className="border-b hover:bg-muted/50">
                      <td className="py-2"><a href={`/projects/${r.projectId}`} className="text-primary hover:underline font-medium">{r.externalNumber}</a></td>
                      <td className="py-2">{r.clientName}</td>
                      <td className="py-2 text-right">{f(r.contractAmount)}</td>
                      <td className="py-2 text-right text-green-600">{f(r.received)}</td>
                      <td className="py-2 text-right font-medium">{f(r.amount)}</td>
                      <td className="py-2 text-right">
                        {r.overdue ? (
                          <span className="text-red-600 flex items-center justify-end gap-1"><AlertTriangle className="size-3" />{d(r.dueDate)}</span>
                        ) : d(r.dueDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Таблица кредиторки */}
      <Card>
        <CardHeader><CardTitle>Кредиторская задолженность (поставщики, дизайнеры)</CardTitle></CardHeader>
        <CardContent>
          {payables.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Нет кредиторской задолженности</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="text-left py-2">Тип</th><th className="text-left py-2">Кому</th>
                  <th className="text-left py-2">Проект</th><th className="text-right py-2">Сумма</th>
                  <th className="text-right py-2">Срок</th>
                </tr></thead>
                <tbody>
                  {payables.map((p) => (
                    <tr key={`${p.type}-${p.refId}`} className="border-b hover:bg-muted/50">
                      <td className="py-2"><Badge variant={p.type === "designer" ? "outline" : "default"}>{p.type === "designer" ? "Дизайнер" : "Поставщик"}</Badge></td>
                      <td className="py-2 font-medium">{p.counterpartyName}</td>
                      <td className="py-2 text-muted-foreground">{p.projectName ?? "—"}</td>
                      <td className="py-2 text-right font-medium">{f(p.amount)}</td>
                      <td className="py-2 text-right">
                        {p.overdue ? (
                          <span className="text-red-600 flex items-center justify-end gap-1"><AlertTriangle className="size-3" />{d(p.dueDate)}</span>
                        ) : p.type === "designer" ? <span className="text-muted-foreground">ожидает</span> : d(p.dueDate)}
                      </td>
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
