"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon } from "lucide-react"

import { purchaseRequestsApi, ApiClientError } from "@/lib/api/purchase-requests"
import type { PurchaseRequestData, PurchaseRequestStatus } from "@/lib/api/types"
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
import { PurchaseRequestCreateDialog } from "@/components/procurement/purchase-request-create-dialog"

type StatusFilter = "all" | PurchaseRequestStatus

const STATUS_LABELS: Record<PurchaseRequestStatus, string> = {
  draft: "Черновик",
  sent: "Отправлен",
  responded: "Ответ получен",
  partial: "Частично",
  closed: "Закрыт",
  cancelled: "Отменён",
}

function statusVariant(status: PurchaseRequestStatus) {
  switch (status) {
    case "sent":
      return "default" as const
    case "responded":
      return "secondary" as const
    case "closed":
      return "secondary" as const
    case "cancelled":
      return "outline" as const
    case "partial":
      return "outline" as const
    default:
      return "outline" as const
  }
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—"
  const date = typeof d === "string" ? new Date(d) : d
  return date.toLocaleDateString("ru-RU")
}

export default function PurchaseRequestListPage() {
  const [requests, setRequests] = useState<PurchaseRequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [createOpen, setCreateOpen] = useState(false)

  const fetchRequests = useCallback(async (status: StatusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const params = status !== "all" ? { status } : undefined
      const response = await purchaseRequestsApi.getPurchaseRequests(params)
      setRequests(response.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить запросы.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests(statusFilter)
  }, [statusFilter, fetchRequests])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Запросы поставщикам</h1>
        <Button onClick={() => setCreateOpen(true)}>Создать из BOM</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-1.5 w-56">
            <label className="text-sm text-muted-foreground">Статус</label>
            <Select
              value={statusFilter}
              onValueChange={(value) => value && setStatusFilter(value as StatusFilter)}
              items={{ all: "Все статусы", ...STATUS_LABELS }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Все статусы</SelectItem>
                  {(Object.keys(STATUS_LABELS) as PurchaseRequestStatus[]).map((s) => (
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
          <span className="ml-2 text-muted-foreground">Загрузка запросов...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={() => fetchRequests(statusFilter)}>
                <RefreshCwIcon className="size-4" />
                <span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && requests.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">Запросы не найдены</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Проект</TableHead>
                <TableHead>Поставщик</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Отправлен</TableHead>
                <TableHead>Позиций</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link
                      href={`/procurement/purchase-requests/${r.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {r.number}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {r.project?.name ?? r.projectId}
                  </TableCell>
                  <TableCell>{r.supplier?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(r.status as PurchaseRequestStatus)}>
                      {STATUS_LABELS[r.status as PurchaseRequestStatus] ?? r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{fmtDate(r.sentAt)}</TableCell>
                  <TableCell>{r.items?.length ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PurchaseRequestCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => fetchRequests(statusFilter)}
      />
    </div>
  )
}
