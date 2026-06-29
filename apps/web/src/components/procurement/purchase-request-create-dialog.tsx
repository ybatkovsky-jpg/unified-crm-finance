"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { purchaseRequestsApi, ApiClientError } from "@/lib/api/purchase-requests"
import { bomApi } from "@/lib/api/bom"
import { warehouseApi } from "@/lib/api/warehouse"
import type { SupplierGroupData, PurchaseRequestData, WarehouseItemData } from "@/lib/api/types"
import { Package, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface GroupWithWarehouse extends SupplierGroupData {
  warehouseItems: (WarehouseItemData | null)[]
}

/**
 * Create PurchaseRequests from a locked BOM: user enters a projectId, the dialog
 * fetches the BOM, previews supplier grouping with warehouse availability,
 * then creates one request per group and reserves warehouse stock.
 */
export function PurchaseRequestCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  const [projectId, setProjectId] = useState("")
  const [groups, setGroups] = useState<GroupWithWarehouse[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<PurchaseRequestData[] | null>(null)

  const reset = () => {
    setProjectId("")
    setGroups(null)
    setError(null)
    setCreated(null)
    setLoading(false)
    setCreating(false)
  }

  /**
   * Look up warehouse availability for a BOM item by matching name or article.
   * Returns the best-matching warehouse item or null.
   */
  const findWarehouseItem = async (
    item: { name: string; article?: string | null }
  ): Promise<WarehouseItemData | null> => {
    try {
      // Try article match first (more precise)
      if (item.article) {
        const res = await warehouseApi.getItems({ search: item.article })
        if (res.data.length > 0) return res.data[0]
      }
      // Then try name match
      const res = await warehouseApi.getItems({ search: item.name })
      if (res.data.length > 0) return res.data[0]
      return null
    } catch {
      return null
    }
  }

  const handlePreview = async () => {
    setLoading(true)
    setError(null)
    setCreated(null)
    try {
      const bomRes = await bomApi.getBOM(projectId.trim())
      const groupRes = await purchaseRequestsApi.groupBOM(bomRes.data.id)
      const plainGroups = groupRes.data

      // Look up warehouse availability for each item
      const enriched: GroupWithWarehouse[] = await Promise.all(
        plainGroups.map(async (g) => {
          const warehouseItems = await Promise.all(
            g.items.map((it) => findWarehouseItem({ name: it.name, article: it.article }))
          )
          return { ...g, warehouseItems }
        })
      )

      setGroups(enriched)
      if (enriched.length === 0) {
        setError("У этого BOM нет позиций с назначенными поставщиками.")
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Не удалось загрузить BOM. Проверьте projectId и что BOM залочен."
      )
      setGroups(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!groups) return
    setCreating(true)
    setError(null)
    try {
      const results: PurchaseRequestData[] = []
      for (const g of groups) {
        // Create PR
        const res = await purchaseRequestsApi.createPurchaseRequest({
          projectId: projectId.trim(),
          supplierId: g.supplierId,
          items: g.items.map((it, i) => {
            const wh = g.warehouseItems[i]
            return {
              bomItemId: it.id,
              quantity: it.quantity,
              price: Number(it.price ?? 0),
              available: !!wh && wh.availableQty > 0,
              availableQty: wh?.availableQty ?? 0,
              deliveryDays: 0,
            }
          }),
        })
        results.push(res.data)

        // Reserve warehouse stock for items found in warehouse
        for (let i = 0; i < g.items.length; i++) {
          const wh = g.warehouseItems[i]
          if (wh && wh.availableQty > 0) {
            try {
              const reserveQty = Math.min(g.items[i].quantity, wh.availableQty)
              await warehouseApi.applyTransaction(wh.id, {
                type: "reserve",
                quantity: -reserveQty,
                bomItemId: g.items[i].id,
                notes: `Резерв под PR ${res.data.number}`,
              })
            } catch {
              // Non-critical: reservation failure shouldn't block PR creation
            }
          }
        }
      }
      setCreated(results)
      onSuccess?.()
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Ошибка при создании запросов."
      )
    } finally {
      setCreating(false)
    }
  }

  const close = (o: boolean) => {
    if (!o) reset()
    onOpenChange(o)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[640px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Создать запросы из BOM</DialogTitle>
          <DialogDescription>
            Введите projectId загруженной и залоченной спецификации. Система сгруппирует
            позиции по поставщикам и проверит наличие на складе.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="projectId">Project ID</Label>
            <Input
              id="projectId"
              placeholder="например, uuid проекта"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={loading || creating || !!created}
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              {error}
            </div>
          )}

          {groups && !created && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Найдено поставщиков: {groups.length}
              </p>
              {groups.map((g) => (
                <div
                  key={g.supplierId}
                  className="rounded-md border"
                >
                  <div className="flex items-center justify-between border-b bg-muted/30 p-3">
                    <div>
                      <p className="text-sm font-medium">{g.supplier.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {g.supplier.email || "нет email"}
                      </p>
                    </div>
                    <Badge variant="secondary">{g.items.length} поз.</Badge>
                  </div>
                  <div className="divide-y">
                    {g.items.map((item, i) => {
                      const wh = g.warehouseItems[i]
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} {item.unit || "шт"}
                              {item.article ? ` · арт. ${item.article}` : ""}
                            </p>
                          </div>
                          <div className="ml-2 flex items-center gap-2 shrink-0">
                            {wh ? (
                              wh.availableQty > 0 ? (
                                <Badge
                                  variant="outline"
                                  className="text-green-700 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950"
                                >
                                  <Package className="size-3 mr-1" />
                                  На складе: {wh.availableQty} {wh.unit || "шт"}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Нет на складе
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Не найден
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {created && (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="size-8 text-green-600" />
              <p className="text-sm text-green-600 dark:text-green-400">
                Создано запросов: {created.length}. Складские позиции зарезервированы.
              </p>
              <p className="text-xs text-muted-foreground">
                Перейдите в список запросов, чтобы отправить их поставщикам.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!created && !groups && (
            <Button onClick={handlePreview} disabled={loading || !projectId.trim()}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span className="ml-1.5">Загрузка...</span>
                </>
              ) : (
                "Предпросмотр групп"
              )}
            </Button>
          )}
          {groups && !created && (
            <Button onClick={handleCreate} disabled={creating || groups.length === 0}>
              {creating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span className="ml-1.5">Создание...</span>
                </>
              ) : (
                `Создать ${groups.length} запрос(ов)`
              )}
            </Button>
          )}
          {created && (
            <Button onClick={() => close(false)}>Готово</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
