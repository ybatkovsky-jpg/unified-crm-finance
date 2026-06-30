"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, PencilIcon, Trash2Icon, ChevronRightIcon } from "lucide-react"

import { cashflowPaymentsApi, ApiClientError } from "@/lib/api/cashflow-payments"
import type { CashFlowPaymentData, CashFlowPaymentListParams } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

const STATUSES = ["planned", "scheduled", "paid", "cancelled"] as const

function formatDate(d: Date | string): string { return new Date(d).toLocaleDateString("ru-RU") }
function formatCurrency(a: number): string { return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(a) }
function statusVariant(s: string): "default" | "secondary" | "outline" | "destructive" {
  switch (s) { case "paid": return "default"; case "scheduled": return "secondary"; case "cancelled": return "destructive"; default: return "outline"; }
}

export default function PaymentListPage() {
  const [payments, setPayments] = useState<CashFlowPaymentData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<CashFlowPaymentData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form
  const [fDate, setFDate] = useState("")
  const [fAmount, setFAmount] = useState("")
  const [fType, setFType] = useState("")
  const [fDescription, setFDescription] = useState("")
  const [fStatus, setFStatus] = useState("planned")
  const [fDueDate, setFDueDate] = useState("")
  const [fError, setFError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchPayments = useCallback(async (status: string) => {
    setLoading(true); setError(null)
    try {
      const params: CashFlowPaymentListParams = {}
      if (status !== "all") params.status = status
      const res = await cashflowPaymentsApi.getPayments(Object.keys(params).length ? params : undefined)
      setPayments(res.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить платежи.")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPayments(statusFilter) }, [statusFilter, fetchPayments])

  const openCreate = () => {
    setEditingPayment(null); setFDate(new Date().toISOString().slice(0, 10)); setFAmount("")
    setFType(""); setFDescription(""); setFStatus("planned"); setFDueDate(""); setFError(null); setFormOpen(true)
  }
  const openEdit = (p: CashFlowPaymentData) => {
    setEditingPayment(p); setFDate(new Date(p.date).toISOString().slice(0, 10)); setFAmount(String(p.amount))
    setFType(p.type); setFDescription(p.description ?? ""); setFStatus(p.status)
    setFDueDate(p.dueDate ? new Date(p.dueDate).toISOString().slice(0, 10) : ""); setFError(null); setFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFError(null)
    if (!fDate) { setFError("Date is required"); return }
    if (!fAmount || isNaN(Number(fAmount))) { setFError("Valid amount required"); return }
    if (!fType) { setFError("Type is required"); return }
    setSubmitting(true)
    try {
      if (editingPayment) {
        await cashflowPaymentsApi.updatePayment(editingPayment.id, {
          date: fDate, amount: Number(fAmount), type: fType, description: fDescription || null,
          status: fStatus, dueDate: fDueDate || null,
        })
      } else {
        await cashflowPaymentsApi.createPayment({
          date: fDate, amount: Number(fAmount), type: fType, description: fDescription || null,
          status: fStatus, dueDate: fDueDate || null,
        })
      }
      setFormOpen(false); fetchPayments(statusFilter)
    } catch (err) { setFError(err instanceof ApiClientError ? err.message : "Не удалось сохранить.") }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (p: CashFlowPaymentData) => {
    if (!window.confirm(`Delete payment?`)) return
    setDeletingId(p.id)
    try { await cashflowPaymentsApi.deletePayment(p.id); fetchPayments(statusFilter) }
    catch (err) { setError(err instanceof ApiClientError ? err.message : "Не удалось удалить.") }
    finally { setDeletingId(null) }
  }

  const totalPlanned = payments.filter(p => p.status === "planned").reduce((s, p) => s + Number(p.amount), 0)
  const totalScheduled = payments.filter(p => p.status === "scheduled").reduce((s, p) => s + Number(p.amount), 0)
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cash Flow Payments</h1>
        <Button onClick={openCreate}>Создать</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPlanned)}</div><div className="text-sm text-muted-foreground">Planned</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalScheduled)}</div><div className="text-sm text-muted-foreground">Scheduled</div></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div><div className="text-sm text-muted-foreground">Paid</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={v => { if (v) setStatusFilter(v) }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Все" /></SelectTrigger>
              <SelectContent><SelectGroup>
                <SelectItem value="all">Все</SelectItem>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectGroup></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="flex justify-center py-12"><RefreshCwIcon className="size-6 animate-spin text-muted-foreground" /><span className="ml-2 text-muted-foreground">Загрузка...</span></div>}
      {error && <Card><CardContent className="pt-6"><div className="flex flex-col items-center gap-3 py-8"><p className="text-destructive">{error}</p><Button variant="outline" onClick={() => fetchPayments(statusFilter)}><RefreshCwIcon className="size-4" /><span className="ml-1.5">Повторить</span></Button></div></CardContent></Card>}
      {!loading && !error && payments.length === 0 && <Card><CardContent className="pt-6"><p className="text-center text-muted-foreground py-8">Платежи не найдены</p></CardContent></Card>}

      {!loading && !error && payments.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Дата</TableHead><TableHead>Описание</TableHead><TableHead>Тип</TableHead><TableHead className="text-right">Сумма</TableHead><TableHead>Статус</TableHead><TableHead>Срок</TableHead><TableHead className="w-[100px]">Действия</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {payments.map(p => (
                <TableRow key={p.id}>
                  <TableCell><Link href={`/finance/payments/${p.id}`} className="text-primary hover:underline">{formatDate(p.date)}</Link></TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">{p.description || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(Number(p.amount))}</TableCell>
                  <TableCell><Badge variant={statusVariant(p.status)}>{p.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{p.dueDate ? formatDate(p.dueDate) : "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(p)}><PencilIcon className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDelete(p)} disabled={deletingId === p.id}><Trash2Icon className="size-4" /></Button>
                      <Link href={`/finance/payments/${p.id}`}><Button variant="ghost" size="icon" className="size-8"><ChevronRightIcon className="size-4" /></Button></Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader><DialogTitle>{editingPayment ? "Редактировать платёж" : "Создать платёж"}</DialogTitle><DialogDescription>{editingPayment ? "Обновить данные платежа." : "Запланировать новый платёж."}</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit}>
            {fError && <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{fError}</div>}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Дата *</Label><Input type="date" value={fDate} onChange={e => setFDate(e.target.value)} /></div>
                <div className="grid gap-2"><Label>Сумма *</Label><Input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)} min="0" step="any" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Тип *</Label><Select value={fType} onValueChange={v => { if (v) setFType(v) }}><SelectTrigger><SelectValue placeholder="Выбрать" /></SelectTrigger><SelectContent><SelectGroup><SelectItem value="income">Доход</SelectItem><SelectItem value="expense">Расход</SelectItem></SelectGroup></SelectContent></Select></div>
                <div className="grid gap-2"><Label>Статус</Label><Select value={fStatus} onValueChange={v => { if (v) setFStatus(v) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectGroup></SelectContent></Select></div>
              </div>
              <div className="grid gap-2"><Label>Срок</Label><Input type="date" value={fDueDate} onChange={e => setFDueDate(e.target.value)} /></div>
              <div className="grid gap-2"><Label>Описание</Label><Input value={fDescription} onChange={e => setFDescription(e.target.value)} placeholder="Описание платежа" /></div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>Отмена</Button>
              <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="size-4 animate-spin" />}{submitting ? "Сохранение..." : editingPayment ? "Сохранить" : "Создать"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
