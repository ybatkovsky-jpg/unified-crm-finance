"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon } from "lucide-react"

import { invoicesApi, ApiClientError } from "@/lib/api/invoices"
import type { InvoiceData, InvoiceStatus } from "@/lib/api/types"
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
import { InvoiceUploadDialog } from "@/components/procurement/invoice-upload-dialog"

type StatusFilter = "all" | InvoiceStatus

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  received: "Получен",
  verified: "Свёран",
  discrepancy: "Расхождение",
  approved: "Одобрен",
}

function statusVariant(s: InvoiceStatus) {
  if (s === "approved") return "default" as const
  if (s === "verified") return "secondary" as const
  if (s === "discrepancy") return "outline" as const
  return "outline" as const
}

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [uploadOpen, setUploadOpen] = useState(false)

  const fetchInvoices = useCallback(async (status: StatusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const params = status !== "all" ? { status } : undefined
      const response = await invoicesApi.getInvoices(params)
      setInvoices(response.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить счета.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvoices(statusFilter)
  }, [statusFilter, fetchInvoices])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Счета от поставщиков</h1>
        <Button onClick={() => setUploadOpen(true)}>Загрузить счёт</Button>
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
                  {(Object.keys(STATUS_LABELS) as InvoiceStatus[]).map((s) => (
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
          <span className="ml-2 text-muted-foreground">Загрузка счетов...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={() => fetchInvoices(statusFilter)}>
                <RefreshCwIcon className="size-4" />
                <span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && invoices.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">Счета не найдены</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && invoices.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Проект</TableHead>
                <TableHead>Поставщик</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Позиций</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link
                      href={`/procurement/invoices/${inv.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {inv.invoiceNumber || inv.number}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {inv.project?.name ?? inv.projectId}
                  </TableCell>
                  <TableCell>{inv.supplier?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(inv.status as InvoiceStatus)}>
                      {STATUS_LABELS[inv.status as InvoiceStatus] ?? inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{(inv.totalAmount ?? 0).toLocaleString("ru-RU")}</TableCell>
                  <TableCell>{inv.items?.length ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <InvoiceUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => fetchInvoices(statusFilter)}
      />
    </div>
  )
}
