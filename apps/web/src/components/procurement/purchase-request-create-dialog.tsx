"use client"

import { useState } from "react"
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
import type { SupplierGroupData, PurchaseRequestData } from "@/lib/api/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/**
 * Create PurchaseRequests from a locked BOM: user enters a projectId, the dialog
 * fetches the BOM, previews supplier grouping, then creates one request per group.
 */
export function PurchaseRequestCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  const [projectId, setProjectId] = useState("")
  const [groups, setGroups] = useState<SupplierGroupData[] | null>(null)
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

  const handlePreview = async () => {
    setLoading(true)
    setError(null)
    setCreated(null)
    try {
      const bomRes = await bomApi.getBOM(projectId.trim())
      const groupRes = await purchaseRequestsApi.groupBOM(bomRes.data.id)
      setGroups(groupRes.data)
      if (groupRes.data.length === 0) {
        setError("У этого BOM нет позиций с назначенными поставщиками.")
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить BOM. Проверьте projectId и что BOM залочен.")
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
        const res = await purchaseRequestsApi.createPurchaseRequest({
          projectId: projectId.trim(),
          supplierId: g.supplierId,
          items: g.items.map((it) => ({ bomItemId: it.id, quantity: it.quantity, price: it.price ?? 0 })),
        })
        results.push(res.data)
      }
      setCreated(results)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Ошибка при создании запросов.")
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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Создать запросы из BOM</DialogTitle>
          <DialogDescription>
            Введите projectId загруженной и залоченной спецификации. Система сгруппирует позиции по поставщикам.
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

          {error && <p className="text-sm text-destructive">{error}</p>}

          {groups && !created && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Найдено поставщиков: {groups.length}</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groups.map((g) => (
                  <div key={g.supplierId} className="flex items-center justify-between rounded-md border p-2">
                    <div>
                      <p className="text-sm font-medium">{g.supplier.name}</p>
                      <p className="text-xs text-muted-foreground">{g.supplier.email || "нет email"}</p>
                    </div>
                    <Badge variant="secondary">{g.items.length} поз.</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {created && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Создано запросов: {created.length}. Перейдите в список, чтобы отправить их.
            </p>
          )}
        </div>

        <DialogFooter>
          {!created && !groups && (
            <Button onClick={handlePreview} disabled={loading || !projectId.trim()}>
              {loading ? "Загрузка..." : "Предпросмотр групп"}
            </Button>
          )}
          {groups && !created && (
            <Button onClick={handleCreate} disabled={creating || groups.length === 0}>
              {creating ? "Создание..." : `Создать ${groups.length} запрос(ов)`}
            </Button>
          )}
          {created && (
            <Button
              onClick={() => close(false)}
            >
              Готово
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
