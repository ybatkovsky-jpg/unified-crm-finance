"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, RefreshCwIcon, TruckIcon } from "lucide-react"

import { deliveriesApi, ApiClientError } from "@/lib/api/deliveries"
import type { DeliveryData, DeliveryStatus } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: "Ожидает",
  shipped: "Отгружена",
  in_transit: "В пути",
  delivered: "Доставлена",
  cancelled: "Отменена",
}

const NEXT_STATUSES: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ["shipped", "in_transit", "delivered", "cancelled"],
  shipped: ["in_transit", "delivered", "cancelled"],
  in_transit: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
}

export default function DeliveryDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [nextStatus, setNextStatus] = useState<DeliveryStatus | "">("")

  const fetchDelivery = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await deliveriesApi.getDelivery(id)
      setDelivery(res.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить поставку.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDelivery()
  }, [fetchDelivery])

  const handleStatus = async () => {
    if (!nextStatus) return
    setBusy(true)
    setError(null)
    try {
      const res = await deliveriesApi.updateStatus(id, nextStatus)
      setDelivery(res.data)
      setNextStatus("")
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось сменить статус.")
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

  if (error && !delivery) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <BackLink />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchDelivery}>
          <RefreshCwIcon className="size-4" /> Повторить
        </Button>
      </div>
    )
  }

  if (!delivery) return null

  const status = delivery.status as DeliveryStatus
  const allowed = NEXT_STATUSES[status]
  const isTerminal = allowed.length === 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackLink />

      <div className="flex items-center gap-3">
        <TruckIcon className="size-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold flex items-center gap-3">
          Поставка <span className="text-muted-foreground font-mono text-base">{delivery.id.slice(0, 8)}</span>
          <Badge>{STATUS_LABELS[status] ?? status}</Badge>
        </h1>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Детали</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <Field label="Поставщик" value={delivery.supplier?.name ?? delivery.supplierId} />
          <Field label="Проект" value={delivery.project?.name ?? delivery.projectId} />
          <Field label="Счёт" value={delivery.invoice?.invoiceNumber ?? delivery.invoiceId ?? "—"} />
          <Field label="Перевозчик" value={delivery.carrier ?? "—"} />
          <Field label="Трек-номер" value={delivery.trackingNumber ?? "—"} />
          <Field label="Ожидаемая дата" value={fmt(delivery.estimatedDate)} />
          <Field label="Фактическая дата" value={fmt(delivery.actualDate)} />
        </CardContent>
      </Card>

      {/* Status transition */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Статус</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          {isTerminal ? (
            <p className="text-sm text-muted-foreground">
              {status === "delivered"
                ? "Поставка доставлена — склад обновлён автоматически."
                : "Поставка отменена."}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 w-48">
                <Label>Перевести в</Label>
                <Select value={nextStatus} onValueChange={(v) => v && setNextStatus(v as DeliveryStatus)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowed.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleStatus} disabled={busy || !nextStatus}>
                Применить
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

function fmt(d: string | Date | null | undefined) {
  if (!d) return "—"
  return (typeof d === "string" ? new Date(d) : d).toLocaleDateString("ru-RU")
}

function BackLink() {
  return (
    <Link
      href="/procurement/deliveries"
      className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
    >
      <ArrowLeftIcon className="size-4 mr-1" /> К списку поставок
    </Link>
  )
}
