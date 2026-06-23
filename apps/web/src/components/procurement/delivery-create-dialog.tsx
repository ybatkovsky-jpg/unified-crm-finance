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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { deliveriesApi, ApiClientError } from "@/lib/api/deliveries"
import { invoicesApi } from "@/lib/api/invoices"
import type { InvoiceData } from "@/lib/api/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/** Create a delivery from an invoice. */
export function DeliveryCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  const [invoices, setInvoices] = useState<InvoiceData[]>([])
  const [invoiceId, setInvoiceId] = useState("")
  const [carrier, setCarrier] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    invoicesApi
      .getInvoices()
      .then((r) => setInvoices(r.data))
      .catch(() => setInvoices([]))
  }, [open])

  const reset = () => {
    setInvoiceId("")
    setCarrier("")
    setTrackingNumber("")
    setError(null)
    setSaving(false)
  }

  const selected = invoices.find((i) => i.id === invoiceId)

  const handleCreate = async () => {
    setError(null)
    if (!selected) {
      setError("Выберите счёт.")
      return
    }
    setSaving(true)
    try {
      await deliveriesApi.createDelivery({
        projectId: selected.projectId,
        supplierId: selected.supplierId,
        invoiceId: selected.id,
        carrier: carrier.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
      })
      onSuccess?.()
      onOpenChange(false)
      reset()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось создать поставку.")
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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Новая поставка</DialogTitle>
          <DialogDescription>Создаётся из счёта. При delivered склад обновится автоматически.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Счёт</Label>
            <Select value={invoiceId} onValueChange={(v) => v && setInvoiceId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите счёт" />
              </SelectTrigger>
              <SelectContent>
                {invoices.length === 0 && (
                  <SelectItem value="__none" disabled>
                    Нет счетов
                  </SelectItem>
                )}
                {invoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoiceNumber || inv.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="carrier">Перевозчик</Label>
              <Input id="carrier" placeholder="СДЭК, Деловые линии..." value={carrier} onChange={(e) => setCarrier(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tracking">Трек-номер</Label>
              <Input id="tracking" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? "Создание..." : "Создать поставку"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
