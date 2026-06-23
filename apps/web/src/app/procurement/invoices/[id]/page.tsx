"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, RefreshCwIcon, CheckCircle2Icon, UnlinkIcon } from "lucide-react"

import { invoicesApi, ApiClientError } from "@/lib/api/invoices"
import { bomApi } from "@/lib/api/bom"
import type {
  InvoiceData,
  InvoiceItemData,
  InvoiceStatus,
  BOMItemData,
} from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  received: "Получен",
  verified: "Свёран",
  discrepancy: "Расхождение",
  approved: "Одобрен",
}

export default function InvoiceReconcilePage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [items, setItems] = useState<InvoiceItemData[]>([])
  const [orderItems, setOrderItems] = useState<BOMItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await invoicesApi.getInvoice(id)
      setInvoice(res.data)
      setItems(res.data.items ?? [])
      // Order = the project's BOM items
      try {
        const bomRes = await bomApi.getBOM(res.data.projectId)
        setOrderItems(bomRes.data.items ?? [])
      } catch {
        setOrderItems([])
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить счёт.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const refreshInvoice = async () => {
    const res = await invoicesApi.getInvoice(id)
    setInvoice(res.data)
    setItems(res.data.items ?? [])
  }

  const handleMatch = async (itemId: string, bomItemId: string) => {
    setBusy(true)
    setError(null)
    try {
      if (bomItemId === "__none__") {
        await invoicesApi.unmatchItem(itemId)
      } else {
        await invoicesApi.matchItem(itemId, bomItemId)
      }
      await refreshInvoice()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Сопоставление не удалось.")
    } finally {
      setBusy(false)
    }
  }

  const handleRecompute = async () => {
    setBusy(true)
    setError(null)
    try {
      await invoicesApi.recomputeStatus(id)
      await refreshInvoice()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось пересчитать статус.")
    } finally {
      setBusy(false)
    }
  }

  const handleApprove = async () => {
    setBusy(true)
    setError(null)
    try {
      await invoicesApi.approveInvoice(id)
      await refreshInvoice()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось одобрить.")
    } finally {
      setBusy(false)
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

  if (error && !invoice) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <BackLink />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchAll}>
          <RefreshCwIcon className="size-4" /> Повторить
        </Button>
      </div>
    )
  }

  if (!invoice) return null

  const status = invoice.status as InvoiceStatus
  const matchedCount = items.filter((i) => i.isMatch).length
  const canApprove = status === "verified" || status === "discrepancy"
  const matchedOrderIds = new Set(items.map((i) => i.bomItemId).filter(Boolean))

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackLink />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            {invoice.invoiceNumber || invoice.number}
            <Badge>{STATUS_LABELS[status] ?? status}</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Поставщик: {invoice.supplier?.name ?? invoice.supplierId}
            {invoice.project ? ` · Проект: ${invoice.project.name}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRecompute} disabled={busy}>
            <RefreshCwIcon className="size-4" /> Пересчитать статус
          </Button>
          <Button size="sm" onClick={handleApprove} disabled={busy || !canApprove}>
            <CheckCircle2Icon className="size-4" /> Одобрить
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Reconciliation / diff (PROC-24/26) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Сверка позиций ({matchedCount}/{items.length} сопоставлено)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет позиций в счёте</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Позиция счёта</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Сопоставлено с (заказ)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="font-medium">{it.name}</TableCell>
                      <TableCell>{it.quantity}</TableCell>
                      <TableCell>{(it.price ?? 0).toLocaleString("ru-RU")}</TableCell>
                      <TableCell>
                        {status === "approved" ? (
                          <span className="text-sm">
                            {it.bomItem?.name ?? "—"}
                            {it.isMatch && (
                              <CheckCircle2Icon className="inline size-4 ml-1 text-green-600" />
                            )}
                          </span>
                        ) : (
                          <Select
                            value={it.bomItemId ?? "__none__"}
                            onValueChange={(v) => handleMatch(it.id, v ?? "__none__")}
                          >
                            <SelectTrigger className="w-full min-w-[180px]">
                              <SelectValue placeholder="Не сопоставлено" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— Не сопоставлено —</SelectItem>
                              {orderItems.map((oi) => (
                                <SelectItem key={oi.id} value={oi.id}>
                                  {oi.name}
                                  {matchedOrderIds.has(oi.id) && oi.id !== it.bomItemId
                                    ? " (уже сопоставлено)"
                                    : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {it.mismatchReason && (
                          <span className="block text-xs text-amber-600 mt-1">
                            <UnlinkIcon className="inline size-3" /> {it.mismatchReason}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order (BOM) items — the other side of the diff */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Заказанные позиции (BOM проекта)</CardTitle>
        </CardHeader>
        <CardContent>
          {orderItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">BOM проекта не найден или пуст</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Позиция</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead>Сопоставлено</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((oi) => (
                    <TableRow key={oi.id}>
                      <TableCell className="font-medium">{oi.name}</TableCell>
                      <TableCell>{oi.quantity} {oi.unit}</TableCell>
                      <TableCell>
                        {matchedOrderIds.has(oi.id) ? (
                          <Badge variant="secondary">да</Badge>
                        ) : (
                          <Badge variant="outline">нет в счёте</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/procurement/invoices"
      className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
    >
      <ArrowLeftIcon className="size-4 mr-1" /> К списку счетов
    </Link>
  )
}
