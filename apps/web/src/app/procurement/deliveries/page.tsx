"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon } from "lucide-react"

import { deliveriesApi, ApiClientError } from "@/lib/api/deliveries"
import type { DeliveryData, DeliveryStatus } from "@/lib/api/types"
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DeliveryCreateDialog } from "@/components/procurement/delivery-create-dialog"

type StatusFilter = "all" | DeliveryStatus

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: "Ожидает",
  shipped: "Отгружена",
  in_transit: "В пути",
  delivered: "Доставлена",
  cancelled: "Отменена",
}

function statusVariant(s: DeliveryStatus) {
  if (s === "delivered") return "default" as const
  if (s === "cancelled") return "outline" as const
  return "secondary" as const
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—"
  return (typeof d === "string" ? new Date(d) : d).toLocaleDateString("ru-RU")
}

export default function DeliveryListPage() {
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [createOpen, setCreateOpen] = useState(false)

  const fetchDeliveries = useCallback(async (status: StatusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const params = status !== "all" ? { status } : undefined
      const response = await deliveriesApi.getDeliveries(params)
      setDeliveries(response.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить поставки.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDeliveries(statusFilter)
  }, [statusFilter, fetchDeliveries])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Поставки</h1>
        <Button onClick={() => setCreateOpen(true)}>Новая поставка</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-1.5 w-56">
            <label className="text-sm text-muted-foreground">Статус</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => value && setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {(Object.keys(STATUS_LABELS) as DeliveryStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={() => fetchDeliveries(statusFilter)}>
                <RefreshCwIcon className="size-4" /> Повторить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && deliveries.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">Поставки не найдены</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && deliveries.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Трек / Счёт</TableHead>
                <TableHead>Поставщик</TableHead>
                <TableHead>Перевозчик</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Ожидаемая дата</TableHead>
                <TableHead>Фактическая дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Link
                      href={`/procurement/deliveries/${d.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {d.trackingNumber || d.invoice?.invoiceNumber || d.invoice?.number || d.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell>{d.supplier?.name ?? "—"}</TableCell>
                  <TableCell>{d.carrier || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(d.status as DeliveryStatus)}>
                      {STATUS_LABELS[d.status as DeliveryStatus] ?? d.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{fmtDate(d.estimatedDate)}</TableCell>
                  <TableCell>{fmtDate(d.actualDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DeliveryCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => fetchDeliveries(statusFilter)}
      />
    </div>
  )
}
