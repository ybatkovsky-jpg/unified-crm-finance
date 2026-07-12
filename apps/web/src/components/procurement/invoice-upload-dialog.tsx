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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { invoicesApi, ApiClientError } from "@/lib/api/invoices"
import { counterpartiesApi } from "@/lib/api/counterparties"
import type { CounterpartyData } from "@/lib/api/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ItemRow {
  name: string
  quantity: string
  price: string
}

/** Manual invoice upload (PROC-27). AI parsing deferred — items entered by hand. */
export function InvoiceUploadDialog({ open, onOpenChange, onSuccess }: Props) {
  const [suppliers, setSuppliers] = useState<CounterpartyData[]>([])
  const [projectId, setProjectId] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [items, setItems] = useState<ItemRow[]>([{ name: "", quantity: "1", price: "0" }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    counterpartiesApi
      .getCounterparties({ type: "supplier" })
      .then((r) => setSuppliers(r.data))
      .catch(() => setSuppliers([]))
  }, [open])

  const reset = () => {
    setProjectId("")
    setSupplierId("")
    setInvoiceNumber("")
    setItems([{ name: "", quantity: "1", price: "0" }])
    setError(null)
    setSaving(false)
  }

  const updateItem = (idx: number, field: keyof ItemRow, value: string) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))
  }

  const handleCreate = async () => {
    setError(null)
    if (!projectId || !supplierId) {
      setError("Укажите проект и поставщика.")
      return
    }
    const validItems = items.filter((it) => it.name.trim())
    if (validItems.length === 0) {
      setError("Добавьте хотя бы одну позицию.")
      return
    }
    setSaving(true)
    try {
      await invoicesApi.createInvoice({
        projectId: projectId.trim(),
        supplierId,
        invoiceNumber: invoiceNumber.trim() || undefined,
        items: validItems.map((it) => ({
          name: it.name.trim(),
          quantity: Number(it.quantity) || 0,
          price: Number(it.price) || 0,
        })),
      })
      onSuccess?.()
      onOpenChange(false)
      reset()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось создать счёт.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Загрузить счёт (вручную)</DialogTitle>
          <DialogDescription>
            AI-парсинг отложен — позиции вводятся вручную (PROC-27).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="projectId">Project ID</Label>
              <Input
                id="projectId"
                placeholder="uuid проекта"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Поставщик</Label>
              <Select
                value={supplierId}
                onValueChange={(v) => v && setSupplierId(v)}
                items={Object.fromEntries(suppliers.map((s) => [s.id, s.name]))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите поставщика" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invoiceNumber">Номер счёта поставщика</Label>
            <Input
              id="invoiceNumber"
              placeholder="например, SUP-2026-001"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Позиции</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setItems((p) => [...p, { name: "", quantity: "1", price: "0" }])}
              >
                <PlusIcon className="size-4" /> Добавить
              </Button>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {items.map((it, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    placeholder="Наименование"
                    value={it.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Кол-во"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="Цена"
                    value={it.price}
                    onChange={(e) => updateItem(idx, "price", e.target.value)}
                    className="w-24"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                    disabled={items.length === 1}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? "Создание..." : "Создать счёт"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
