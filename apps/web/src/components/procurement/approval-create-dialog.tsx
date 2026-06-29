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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { approvalsApi, ApiClientError } from "@/lib/api/approvals"
import { invoicesApi } from "@/lib/api/invoices"
import type { InvoiceData } from "@/lib/api/types"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

/** Create a payment ApprovalRequest from an approved invoice (PROC-28). */
export function ApprovalCreateDialog({ open, onOpenChange, onSuccess }: Props) {
  const [approved, setApproved] = useState<InvoiceData[]>([])
  const [invoiceId, setInvoiceId] = useState("")
  const [requestedBy, setRequestedBy] = useState("manager")
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    invoicesApi
      .getInvoices({ status: "approved" })
      .then((r) => setApproved(r.data))
      .catch(() => setApproved([]))
  }, [open])

  const reset = () => {
    setInvoiceId("")
    setRequestedBy("manager")
    setComment("")
    setError(null)
    setSaving(false)
  }

  const selected = approved.find((i) => i.id === invoiceId)

  const handleCreate = async () => {
    setError(null)
    if (!invoiceId) {
      setError("Выберите счёт.")
      return
    }
    setSaving(true)
    try {
      await approvalsApi.createApproval({
        type: "payment",
        entityId: invoiceId,
        amount: selected?.totalAmount != null ? Number(selected.totalAmount) : undefined,
        requestedBy: requestedBy.trim() || "manager",
        comment: comment.trim() || undefined,
      })
      onSuccess?.()
      onOpenChange(false)
      reset()
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось создать заявку.")
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
          <DialogTitle>Заявка на оплату</DialogTitle>
          <DialogDescription>
            Создаётся из одобренного счёта (PROC-28). Owner получит in-app уведомление.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Счёт (одобренный)</Label>
            <Select value={invoiceId} onValueChange={(v) => v && setInvoiceId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите счёт" />
              </SelectTrigger>
              <SelectContent>
                {approved.length === 0 && (
                  <SelectItem value="__none" disabled>
                    Нет одобренных счетов
                  </SelectItem>
                )}
                {approved.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoiceNumber || inv.number} — {Number(inv.totalAmount ?? 0).toLocaleString("ru-RU")} ₽
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="requestedBy">Запросил (user id)</Label>
            <Input id="requestedBy" value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comment">Комментарий</Label>
            <Input
              id="comment"
              placeholder="например, срочно, оплата до 5 числа"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? "Создание..." : "Отправить на согласование"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
