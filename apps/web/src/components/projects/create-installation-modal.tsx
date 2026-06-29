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
import { installationsApi, ApiClientError } from "@/lib/api/installations"

interface CreateInstallationModalProps {
  projectId: string
  onCreate?: (installation: any) => void
}

export function CreateInstallationModal({ projectId, onCreate }: CreateInstallationModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [plannedStartDate, setPlannedStartDate] = useState("")
  const [advancePercent, setAdvancePercent] = useState("30")
  const [advanceAmount, setAdvanceAmount] = useState("")
  const [cost, setCost] = useState("")
  const [notes, setNotes] = useState("")

  const resetForm = () => {
    setPlannedStartDate("")
    setAdvancePercent("30")
    setAdvanceAmount("")
    setCost("")
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
    setLoading(true)

    try {
      const response = await installationsApi.createInstallation(projectId, {
        plannedStartDate: plannedStartDate || null,
        advancePercent: advancePercent ? parseFloat(advancePercent) : undefined,
        advanceAmount: advanceAmount ? parseFloat(advanceAmount) : undefined,
        cost: cost ? parseFloat(cost) : undefined,
        notes: notes || undefined,
      })

      onCreate?.(response.data)
      setOpen(false)
      resetForm()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        console.error("Failed to create installation:", err)
        setError("Не удалось создать монтаж. Попробуйте снова.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="size-4" />
        <span className="ml-1.5">Добавить заход</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Новый заход на монтаж</DialogTitle>
            <DialogDescription>
              Прогрессивный монтаж: можно начинать частями. Аванс 30% перед началом.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="plannedDate">Плановая дата</Label>
              <Input
                id="plannedDate"
                type="date"
                value={plannedStartDate}
                onChange={(e) => setPlannedStartDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="advancePercent">Аванс (%)</Label>
                <Input
                  id="advancePercent"
                  type="number"
                  value={advancePercent}
                  onChange={(e) => setAdvancePercent(e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="advanceAmount">Сумма аванса (₽)</Label>
                <Input
                  id="advanceAmount"
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cost">Стоимость монтажа (₽)</Label>
              <Input
                id="cost"
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Заметки</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Детали монтажа..."
                rows={3}
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
