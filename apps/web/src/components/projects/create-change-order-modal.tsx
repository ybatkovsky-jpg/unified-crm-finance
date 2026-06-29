"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { changeOrdersApi, ApiClientError } from "@/lib/api/change-orders"

interface CreateChangeOrderModalProps {
  projectId: string
  contractId?: string
  onCreate?: (changeOrder: any) => void
}

export function CreateChangeOrderModal({ projectId, contractId, onCreate }: CreateChangeOrderModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [notes, setNotes] = useState("")

  const resetForm = () => {
    setTitle("")
    setAmount("")
    setDescription("")
    setNotes("")
    setError(null)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("Название обязательно")
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Сумма должна быть больше нуля")
      return
    }

    setLoading(true)
    try {
      const response = await changeOrdersApi.createChangeOrder(projectId, {
        contractId: contractId || null,
        title: title.trim(),
        description: description.trim() || undefined,
        amount: parseFloat(amount),
        notes: notes.trim() || undefined,
      })

      onCreate?.(response.data)
      setOpen(false)
      resetForm()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        console.error("Failed to create change order:", err)
        setError("Не удалось создать доп. работу. Попробуйте снова.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="size-4" />
        <span className="ml-1.5">Добавить доп. работу</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Новая доп. работа</DialogTitle>
            <DialogDescription>
              Дополнительные работы оформляются только по инициативе клиента (изменение объёма).
              Оформляется как доп. соглашение или отдельный учёт.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="title">Название *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Замена столешницы на кварц"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Сумма (₽) *</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Что именно меняется..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Заметки</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Дополнительная информация"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
