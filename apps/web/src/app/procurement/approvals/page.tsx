"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon } from "lucide-react"

import { approvalsApi, ApiClientError } from "@/lib/api/approvals"
import type { ApprovalRequestData, ApprovalStatus } from "@/lib/api/types"
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
import { ApprovalCreateDialog } from "@/components/procurement/approval-create-dialog"

type StatusFilter = "all" | ApprovalStatus

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Ожидает",
  approved: "Одобрено",
  rejected: "Отклонено",
}

function statusVariant(s: ApprovalStatus) {
  if (s === "approved") return "default" as const
  if (s === "rejected") return "outline" as const
  return "secondary" as const
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—"
  return (typeof d === "string" ? new Date(d) : d).toLocaleDateString("ru-RU")
}

export default function ApprovalListPage() {
  const [approvals, setApprovals] = useState<ApprovalRequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [createOpen, setCreateOpen] = useState(false)

  const fetchApprovals = useCallback(async (status: StatusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const params = status !== "all" ? { status } : undefined
      const response = await approvalsApi.getApprovals(params)
      setApprovals(response.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить заявки.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApprovals(statusFilter)
  }, [statusFilter, fetchApprovals])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Согласование оплат</h1>
        <Button onClick={() => setCreateOpen(true)}>Создать заявку</Button>
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
                  {(Object.keys(STATUS_LABELS) as ApprovalStatus[]).map((s) => (
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
          <span className="ml-2 text-muted-foreground">Загрузка заявок...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={() => fetchApprovals(statusFilter)}>
                <RefreshCwIcon className="size-4" />
                <span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && approvals.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">Заявки не найдены</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && approvals.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Тип</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Запросил</TableHead>
                <TableHead>Решение</TableHead>
                <TableHead>Согласовал</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link
                      href={`/procurement/approvals/${a.id}`}
                      className="text-primary hover:underline font-medium capitalize"
                    >
                      {a.type}
                    </Link>
                  </TableCell>
                  <TableCell>{(a.amount ?? 0).toLocaleString("ru-RU")}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(a.status as ApprovalStatus)}>
                      {STATUS_LABELS[a.status as ApprovalStatus] ?? a.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{a.requester?.name ?? a.requestedBy}</TableCell>
                  <TableCell>{fmtDate(a.decidedAt)}</TableCell>
                  <TableCell>{a.decider?.name ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ApprovalCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => fetchApprovals(statusFilter)}
      />
    </div>
  )
}
