"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, RefreshCwIcon, SendIcon, MailIcon } from "lucide-react"

import { purchaseRequestsApi, ApiClientError } from "@/lib/api/purchase-requests"
import type {
  PurchaseRequestData,
  PurchaseRequestItemData,
  PurchaseRequestStatus,
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

const STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  draft: "Черновик",
  sent: "Отправлен",
  responded: "Ответ получен",
  partial: "Частично",
  closed: "Закрыт",
  cancelled: "Отменён",
}

export default function PurchaseRequestDetailPage() {
  const params = useParams<{ id: string }>()
  const { id } = use(params)

  const [request, setRequest] = useState<PurchaseRequestData | null>(null)
  const [items, setItems] = useState<PurchaseRequestItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Позиции ({items.length})</CardTitle>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.bomItem?.name ?? it.bomItemId}</TableCell>
                      <TableCell>{it.quantity}</TableCell>
                      <TableCell>{(it.price ?? 0).toLocaleString("ru-RU")}</TableCell>
                      <TableCell>
                        {((it.quantity || 0) * (it.price || 0)).toLocaleString("ru-RU")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="text-right text-sm font-medium mt-2">Итого: {total.toLocaleString("ru-RU")}</p>
        </CardContent>
      </Card>
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
