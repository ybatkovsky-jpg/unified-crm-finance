"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, RefreshCwIcon, SendIcon, MailIcon, Package, CheckCircle2, Loader2, AlertTriangle } from "lucide-react"

import { purchaseRequestsApi, ApiClientError } from "@/lib/api/purchase-requests"
import { invoicesApi } from "@/lib/api/invoices"
import type {
  PurchaseRequestData,
  PurchaseRequestItemData,
  PurchaseRequestStatus,
  InvoiceData,
} from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  draft: "Черновик",
  sent: "Отправлен",
  responded: "Ответ получен",
  partial: "Частично",
  closed: "Закрыт",
  cancelled: "Отменён",
}

export default function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [request, setRequest] = useState<PurchaseRequestData | null>(null)
  const [items, setItems] = useState<PurchaseRequestItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [receivingItems, setReceivingItems] = useState<Set<string>>(new Set())
  const [linkedInvoices, setLinkedInvoices] = useState<InvoiceData[]>([])
  const [editingMatch, setEditingMatch] = useState<Record<string, { availableQty: number; deliveryDays: number; available: boolean }>>({})
  const [savingMatch, setSavingMatch] = useState(false)

  const fetchRequest = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await purchaseRequestsApi.getPurchaseRequest(id)
      setRequest(res.data)
      setItems(res.data.items ?? [])
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить запрос.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchRequest()
  }, [fetchRequest])

  // Fetch linked invoices
  useEffect(() => {
    if (!request) return
    let cancelled = false
    invoicesApi.getInvoices({ purchaseRequestId: id } as any)
      .then((res: any) => {
        if (!cancelled) setLinkedInvoices(res.data ?? [])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [request, id])

  const handleAction = async (action: "generate" | "send" | "resend") => {
    setBusy(true)
    setError(null)
    try {
      if (action === "generate") {
        const res = await purchaseRequestsApi.generateEmail(id)
        if (res.data) setRequest(res.data)
      } else if (action === "send") {
        const res = await purchaseRequestsApi.sendRequest(id)
        setRequest(res.data)
      } else {
        const res = await purchaseRequestsApi.resendRequest(id)
        setRequest(res.data)
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Действие не удалось.")
    } finally {
      setBusy(false)
    }
  }

  const handleStatusChange = async (status: PurchaseRequestStatus) => {
    setBusy(true)
    setError(null)
    try {
      const res = await purchaseRequestsApi.updateStatus(id, status)
      setRequest(res.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось изменить статус.")
    } finally {
      setBusy(false)
    }
  }

  const handleReceiveItem = async (itemId: string) => {
    setReceivingItems((prev) => new Set(prev).add(itemId))
    setError(null)
    try {
      const res = await purchaseRequestsApi.receiveItem(itemId)
      // Update local items list
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, itemStatus: "received" } : it))
      )
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось отметить получение.")
    } finally {
      setReceivingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  // Initialize matching edit form when items change
  useEffect(() => {
    const init: Record<string, { availableQty: number; deliveryDays: number; available: boolean }> = {}
    items.forEach((it) => {
      const d = it as any
      init[it.id] = {
        availableQty: d.availableQty ?? 0,
        deliveryDays: d.deliveryDays ?? 0,
        available: d.available ?? false,
      }
    })
    setEditingMatch(init)
  }, [items])

  const handleSaveMatching = async () => {
    setSavingMatch(true)
    setError(null)
    try {
      const updates = Object.entries(editingMatch).map(([itemId, data]) =>
        fetch(`/api/purchase-requests/items/${itemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then((r) => r.json())
      )
      await Promise.all(updates)
      const itemsRes = await purchaseRequestsApi.getItems(id)
      setItems(itemsRes.data)
    } catch (err) {
      setError("Не удалось сохранить сверку.")
    } finally {
      setSavingMatch(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center py-12">
        <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Загрузка...</span>
      </div>
    )
  }

  if (error && !request) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <BackLink />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchRequest}>
          <RefreshCwIcon className="size-4" /> Повторить
        </Button>
      </div>
    )
  }

  if (!request) return null

  const status = request.status as PurchaseRequestStatus
  const canSend = status === "draft"
  const canResend = ["sent", "responded", "partial"].includes(status)
  const total = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.price || 0), 0)
  const receivedCount = items.filter((it) => (it as any).itemStatus === "received").length
  const receivedPct = items.length > 0 ? Math.round((receivedCount / items.length) * 100) : 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackLink />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            {request.number}
            <Badge>{STATUS_LABELS[status] ?? status}</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Поставщик: {request.supplier?.name ?? request.supplierId}
            {request.project ? ` · Проект: ${request.project.name}` : ""}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Действия</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => handleAction("generate")} disabled={busy}>
            <MailIcon className="size-4" /> Пересоздать письмо
          </Button>
          {canSend && (
            <Button size="sm" onClick={() => handleAction("send")} disabled={busy}>
              <SendIcon className="size-4" /> Отправить
            </Button>
          )}
          {canResend && (
            <Button variant="outline" size="sm" onClick={() => handleAction("resend")} disabled={busy}>
              <SendIcon className="size-4" /> Отправить повторно
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Сменить статус:</span>
            <Select
              value={status}
              onValueChange={(v) => v && handleStatusChange(v as PurchaseRequestStatus)}
              items={STATUS_LABELS}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABELS) as PurchaseRequestStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Письмо поставщику</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Кому: </span>
            {request.emailTo || "—"}
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Тема: </span>
            {request.emailSubject || "—"}
          </div>
          <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm font-sans">
            {request.emailBody || "—"}
          </pre>
          <p className="text-xs text-muted-foreground">
            Отправка пишется в EmailLog (dev-режим — без реального SMTP).
          </p>
        </CardContent>
      </Card>

      {/* Response Matching */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Сверка ответа поставщика
            </span>
            <Button size="sm" onClick={handleSaveMatching} disabled={savingMatch}>
              {savingMatch ? "Сохранение..." : "Сохранить сверку"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Внесите данные из ответа поставщика: подтверждённое количество, срок поставки и доступность.
          </p>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет позиций</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Позиция</TableHead>
                    <TableHead>Запрошено</TableHead>
                    <TableHead className="w-24">Подтв. кол-во</TableHead>
                    <TableHead className="w-24">Дней дост.</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => {
                    const match = editingMatch[it.id]
                    const requested = it.quantity
                    const confirmed = match?.availableQty ?? 0
                    const discrepancy = requested !== confirmed && confirmed > 0
                    return (
                    <TableRow key={it.id}>
                      <TableCell className="text-sm">{it.bomItem?.name ?? it.bomItemId}</TableCell>
                      <TableCell>{requested}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="h-7 w-20 text-sm"
                          value={match?.availableQty ?? 0}
                          onChange={(e) =>
                            setEditingMatch((prev) => ({
                              ...prev,
                              [it.id]: { ...prev[it.id], availableQty: Number(e.target.value), available: Number(e.target.value) > 0 },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          className="h-7 w-20 text-sm"
                          value={match?.deliveryDays ?? 0}
                          onChange={(e) =>
                            setEditingMatch((prev) => ({
                              ...prev,
                              [it.id]: { ...prev[it.id], deliveryDays: Number(e.target.value) },
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {discrepancy ? (
                          <Badge variant="destructive" className="text-xs">
                            Расхождение: {requested} → {confirmed}
                          </Badge>
                        ) : confirmed > 0 ? (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400">
                            Подтверждено
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Ожидает</span>
                        )}
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Позиции ({items.length})</span>
            {items.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${receivedPct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {receivedCount}/{items.length} получено
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет позиций</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Позиция</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="w-24" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => {
                    const itemStatus = (it as any).itemStatus as string
                    const isReceived = itemStatus === "received"
                    const isReceiving = receivingItems.has(it.id)
                    return (
                    <TableRow key={it.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{it.bomItem?.name ?? it.bomItemId}</p>
                          {it.bomItem?.article && (
                            <p className="text-xs text-muted-foreground">арт. {it.bomItem.article}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{it.quantity}</TableCell>
                      <TableCell>{(it.price ?? 0).toLocaleString("ru-RU")}</TableCell>
                      <TableCell>
                        {((it.quantity || 0) * (it.price || 0)).toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        {isReceived ? (
                          <Badge variant="default" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                            <CheckCircle2 className="size-3 mr-1" />
                            Получен
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Заказан
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!isReceived && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReceiveItem(it.id)}
                            disabled={isReceiving}
                          >
                            {isReceiving ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <>
                                <Package className="size-3.5" />
                                <span className="ml-1 text-xs">Получить</span>
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-right text-sm font-medium mt-2">Итого: {total.toLocaleString("ru-RU")}</p>
        </CardContent>
      </Card>

      {/* Linked Invoices */}
      {linkedInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Связанные счета ({linkedInvoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер счёта</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Получен</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <Link
                          href={`/procurement/invoices/${inv.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {inv.invoiceNumber || inv.number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {Number(inv.totalAmount || 0).toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={inv.status === "paid" ? "default" : "outline"}>
                          {inv.status === "paid" ? "Оплачен" : inv.status === "received" ? "Получен" : inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inv.receivedAt ? new Date(inv.receivedAt).toLocaleDateString("ru-RU") : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/procurement/purchase-requests"
      className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
    >
      <ArrowLeftIcon className="size-4 mr-1" /> К списку запросов
    </Link>
  )
}
