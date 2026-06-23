"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, AlertTriangleIcon } from "lucide-react"

import { warehouseApi, ApiClientError } from "@/lib/api/warehouse"
import type { WarehouseItemData } from "@/lib/api/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type StockLevel = "ok" | "low" | "out"

function stockLevel(item: WarehouseItemData): StockLevel {
  if (item.availableQty <= 0) return "out"
  if (item.availableQty <= item.minQuantity) return "low"
  return "ok"
}

const LEVEL_DOT: Record<StockLevel, string> = {
  ok: "bg-green-500",
  low: "bg-amber-500",
  out: "bg-red-500",
}

const LEVEL_BADGE: Record<StockLevel, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ok: { label: "В норме", variant: "secondary" },
  low: { label: "Мало", variant: "outline" },
  out: { label: "Нет", variant: "destructive" },
}

export default function WarehouseListPage() {
  const [items, setItems] = useState<WarehouseItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [lowStockOnly, setLowStockOnly] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchItems = useCallback(async (s: string, low: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const response = await warehouseApi.getItems({
        search: s || undefined,
        lowStockOnly: low,
      })
      setItems(response.data)
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить склад.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems(debouncedSearch, lowStockOnly)
  }, [debouncedSearch, lowStockOnly, fetchItems])

  const lowCount = items.filter((i) => stockLevel(i) !== "ok").length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Склад</h1>
        {lowCount > 0 && (
          <Badge variant="outline" className="text-amber-600 border-amber-400">
            <AlertTriangleIcon className="size-3.5 mr-1" /> {lowCount} позиций с низким остатком
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="pt-6 flex gap-4 items-end">
          <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
            <label className="text-sm text-muted-foreground">Поиск</label>
            <Input
              placeholder="Название или артикул..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={lowStockOnly ? "default" : "outline"}
            onClick={() => setLowStockOnly((v) => !v)}
          >
            Только низкий остаток
          </Button>
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
              <Button variant="outline" onClick={() => fetchItems(debouncedSearch, lowStockOnly)}>
                <RefreshCwIcon className="size-4" /> Повторить
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">Позиции не найдены</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Позиция</TableHead>
                <TableHead>Артикул</TableHead>
                <TableHead>Всего</TableHead>
                <TableHead>Резерв</TableHead>
                <TableHead>Доступно</TableHead>
                <TableHead>Мин.</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const level = stockLevel(item)
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link
                        href={`/procurement/warehouse/${item.id}`}
                        className="text-primary hover:underline font-medium flex items-center gap-2"
                      >
                        <span className={`size-2 rounded-full ${LEVEL_DOT[level]}`} />
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell>{item.article || "—"}</TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    <TableCell>{item.reservedQty}</TableCell>
                    <TableCell className="font-medium">{item.availableQty}</TableCell>
                    <TableCell>{item.minQuantity}</TableCell>
                    <TableCell>
                      <Badge variant={LEVEL_BADGE[level].variant}>{LEVEL_BADGE[level].label}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
