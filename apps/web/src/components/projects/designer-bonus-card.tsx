"use client"

import { useState, useEffect, useCallback } from "react"
import { Gift, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { designerBonusesApi, ApiClientError } from "@/lib/api/designer-bonus"
import type { DesignerBonusData } from "@/lib/api/types"

interface DesignerBonusCardProps {
  projectId: string
  onUpdate?: () => void
}

function formatRub(n: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n)
}

export function DesignerBonusCard({ projectId, onUpdate }: DesignerBonusCardProps) {
  const [bonus, setBonus] = useState<DesignerBonusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setupOpen, setSetupOpen] = useState(false)
  const [percent, setPercent] = useState("10")
  const [saving, setSaving] = useState(false)
  const [marking, setMarking] = useState(false)

  const fetchBonus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await designerBonusesApi.getDesignerBonus(projectId)
      setBonus(response.data)
      if (response.data) setPercent(String(Math.round(response.data.percent * 100)))
    } catch (err) {
      console.error("Failed to fetch designer bonus:", err)
      setError("Не удалось загрузить бонус дизайнеру")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchBonus()
  }, [fetchBonus])

  const handleSetup = async () => {
    setSaving(true)
    setError(null)
    try {
      const response = await designerBonusesApi.upsertDesignerBonus(projectId, {
        percent: (parseFloat(percent) || 10) / 100,
      })
      setBonus(response.data)
      setSetupOpen(false)
      onUpdate?.()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось сохранить бонус")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!bonus) return
    setMarking(true)
    setError(null)
    try {
      const response = await designerBonusesApi.markPaid(bonus.id)
      setBonus(response.data)
      onUpdate?.()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось отметить выплату")
      }
    } finally {
      setMarking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchBonus}>
          Попробовать снова
        </Button>
      </div>
    )
  }

  // Бонус не заведён
  if (!bonus) {
    return (
      <div className="text-center py-6">
        <Gift className="size-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Бонус дизайнеру не заведён</p>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          По умолчанию 10% от суммы договора
        </p>
        <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
          <DialogTrigger render={<Button size="sm">Завести бонус</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Бонус дизайнеру</DialogTitle>
              <DialogDescription>
                Процент от суммы договора. Сумма рассчитается автоматически.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <Label htmlFor="bonus-percent">Процент, %</Label>
              <Input
                id="bonus-percent"
                type="number"
                min="0"
                max="100"
                step="1"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSetupOpen(false)}>Отмена</Button>
              <Button onClick={handleSetup} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const isPaid = bonus.status === "paid"

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{formatRub(Number(bonus.amount))}</span>
          <Badge variant={isPaid ? "secondary" : "outline"}>
            {isPaid ? "Выплачен" : "Ожидает выплаты"}
          </Badge>
        </div>
        {!isPaid && (
          <Button size="sm" onClick={handleMarkPaid} disabled={marking}>
            <Check className="size-3 mr-1" />
            {marking ? "..." : "Отметить выплаченным"}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{Math.round(bonus.percent * 100)}% от договора</span>
        {bonus.Designer && <span>Дизайнер: {bonus.Designer.name}</span>}
        {isPaid && bonus.paidAt && (
          <span>Выплачен: {new Date(bonus.paidAt).toLocaleDateString("ru-RU")}</span>
        )}
      </div>

      {bonus.notes && <p className="text-xs text-muted-foreground">{bonus.notes}</p>}
    </div>
  )
}
