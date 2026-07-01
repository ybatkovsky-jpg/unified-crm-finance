"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon, RefreshCwIcon } from "lucide-react"

import { warehouseApi, ApiClientError } from "@/lib/api/warehouse"
import type { WarehouseItemDetail, WarehouseTransactionType } from "@/lib/api/types"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const TYPE_LABELS: Record<WarehouseTransactionType, string> = {
  in: "Приём",
  out: "Расход",
  reserve: "Резерв",
  release: "Разрезерв",
};

export default function WarehouseDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [item, setItem] = useState<WarehouseItemDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [txType, setTxType] = useState<WarehouseTransactionType>("in")
  const [txQty, setTxQty] = useState("1")
  const [txNotes, setTxNotes] = useState("")

  const fetchItem = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await warehouseApi.getItem(id)
      setItem(res.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить позицию.")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchItem()
  }, [fetchItem])

  const handleApply = async () => {
    setBusy(true)
    setError(null)
    try {
      await warehouseApi.applyTransaction(id, {
        type: txType,
        quantity: Number(txQty),
        notes: txNotes.trim() || undefined,
      })
      setTxQty("1")
      setTxNotes("")
      await fetchItem()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Операция не удалась.")
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

  if (error && !item) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <BackLink />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={fetchItem}>
          <RefreshCwIcon className="size-4" /> Повторить
        </Button>
      </div>
    )
  }

  if (!item) return null

  const isLow = item.availableQty <= item.minQuantity

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackLink />

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{item.name}</h1>
        {isLow && (
          <Badge variant="outline" className="text-amber-600 border-amber-400">
            Низкий остаток
          </Badge>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Остатки</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Stat label="Всего" value={`${item.quantity} ${item.unit}`} />
          <Stat label="Резерв" value={`${item.reservedQty}`} />
          <Stat label="Доступно" value={`${item.availableQty}`} highlight />
          <Stat label="Минимум" value={`${item.minQuantity}`} />
          <Stat label="Артикул" value={item.article || "—"} />
          <Stat label="Категория" value={item.category || "—"} />
          <Stat label="Место" value={item.location || "—"} />
        </CardContent>
      </Card>

      {/* Transaction form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Операция</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5 w-44">
            <Label>Тип</Label>
            <Select value={txType} onValueChange={(v) => v && setTxType(v as WarehouseTransactionType)} items={TYPE_LABELS}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABELS) as WarehouseTransactionType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 w-28">
            <Label htmlFor="qty">Количество</Label>
            <Input id="qty" type="number" min="0" value={txQty} onChange={(e) => setTxQty(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <Label htmlFor="notes">Комментарий</Label>
            <Input id="notes" value={txNotes} onChange={(e) => setTxNotes(e.target.value)} />
          </div>
          <Button onClick={handleApply} disabled={busy}>
            Применить
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">История операций</CardTitle>
        </CardHeader>
        <CardContent>
          {(!item.transactions || item.transactions.length === 0) ? (
            <p className="text-muted-foreground text-sm">Нет операций</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead>Комментарий</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{new Date(tx.createdAt).toLocaleString("ru-RU")}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{TYPE_LABELS[tx.type as WarehouseTransactionType] ?? tx.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{tx.quantity}</TableCell>
                      <TableCell>{tx.notes || "—"}</TableCell>
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

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className={`text-lg font-medium ${highlight ? "text-primary" : ""}`}>{value}</div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/procurement/warehouse"
      className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
    >
      <ArrowLeftIcon className="size-4 mr-1" /> К списку позиций
    </Link>
  )
}
