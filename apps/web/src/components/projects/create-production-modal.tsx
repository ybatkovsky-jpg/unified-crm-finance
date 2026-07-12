"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { productionsApi, ApiClientError } from "@/lib/api/productions"
import { counterpartiesApi } from "@/lib/api/counterparties"
import type { CounterpartyData } from "@/lib/api/types"

interface CreateProductionModalProps {
  projectId: string
  onCreate?: (production: any) => void
}

const PRODUCTION_TYPE_OPTIONS = [
  { value: "PLATE", label: "Плитные материалы" },
  { value: "COUNTERTOP", label: "Столешницы" },
]

const MATERIAL_MODE_OPTIONS = [
  { value: "our_materials", label: "Из наших материалов" },
  { value: "partner_materials", label: "Из материала партнёра" },
]

const SKILL_TAG_LABELS: Record<string, string> = {
  plate: "ДСП/МДФ",
  stone: "Камень",
  glass: "Стекло",
  concrete: "Бетон",
  paint: "Покраска/плёнка",
  universal: "Универсал",
}

/**
 * Standard production stages that are auto-created when a new production is added.
 * These represent the typical workflow for material production.
 */
const STANDARD_PRODUCTION_STAGES = [
  { code: "ZAKAZ_MATERIALOV", name: "Заказ материалов", order: 1 },
  { code: "POSTUPLENIE", name: "Поступление на склад", order: 2 },
  { code: "RASKROY", name: "Раскрой", order: 3 },
  { code: "POLIROVKA", name: "Полировка", order: 4 },
  { code: "KONTROL_KACHESTVA", name: "Контроль качества", order: 5 },
  { code: "UPAKOVKA", name: "Упаковка", order: 6 },
  { code: "DOSTAVKA", name: "Доставка", order: 7 },
  { code: "MONTAZH", name: "Монтаж", order: 8 },
] as const

export function CreateProductionModal({ projectId, onCreate }: CreateProductionModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [type, setType] = useState<"PLATE" | "COUNTERTOP">("PLATE")
  const [partnerId, setPartnerId] = useState<string>("")
  const [materialMode, setMaterialMode] = useState<string>("our_materials")
  const [plannedStartDate, setPlannedStartDate] = useState("")
  const [plannedEndDate, setPlannedEndDate] = useState("")
  const [notes, setNotes] = useState("")

  // Counterparties (suppliers as potential partners)
  const [partners, setPartners] = useState<CounterpartyData[]>([])
  const [loadingPartners, setLoadingPartners] = useState(false)

  const fetchPartners = async () => {
    setLoadingPartners(true)
    try {
      const response = await counterpartiesApi.getCounterparties({ type: "supplier" })
      setPartners(response.data)
    } catch (err) {
      console.error("Failed to fetch counterparties:", err)
    } finally {
      setLoadingPartners(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchPartners()
    }
  }, [open])

  const resetForm = () => {
    setType("PLATE")
    setPartnerId("")
    setMaterialMode("our_materials")
    setPlannedStartDate("")
    setPlannedEndDate("")
    setNotes("")
    setError(null)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      resetForm()
    }
  }

  const selectedPartner = partners.find(p => p.id === partnerId)
  const partnerSkillTags: string[] = selectedPartner?.types
    ? (Array.isArray(selectedPartner.types) ? selectedPartner.types as string[] : [])
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Create production with type stored in attributes
      const response = await productionsApi.createProduction(projectId, {
        status: "planning",
        partnerId: partnerId || null,
        materialMode: materialMode || "our_materials",
        plannedStartDate: plannedStartDate || undefined,
        plannedEndDate: plannedEndDate || undefined,
        notes: notes || undefined,
        attributes: { type },
      })

      const production = response.data

      // Auto-create standard production stages
      await Promise.all(
        STANDARD_PRODUCTION_STAGES.map((stage) =>
          productionsApi.createStage(production.id, {
            code: stage.code,
            name: stage.name,
            order: stage.order,
            status: "pending",
          })
        )
      )

      // Fetch production with stages for callback
      const productionWithStages = await productionsApi.getProduction(production.id)
      onCreate?.(productionWithStages.data)

      setOpen(false)
      resetForm()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        console.error("Failed to create production:", err)
        setError("Не удалось создать производство. Попробуйте снова.")
      }
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = type !== null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="size-4" />
        <span className="ml-1.5">Добавить производство</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Новое производство</DialogTitle>
            <DialogDescription>
              Создайте запись производства для отслеживания этапов изготовления.
              Назначьте партнёра-производство и режим материала.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}

            {/* Production Type */}
            <div className="grid gap-2">
              <Label htmlFor="type">Тип производства *</Label>
              <Select
                value={type || ""}
                onValueChange={(value) => setType(value as "PLATE" | "COUNTERTOP")}
                items={Object.fromEntries(PRODUCTION_TYPE_OPTIONS.map((o) => [o.value, o.label]))}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Partner Selection */}
            <div className="grid gap-2">
              <Label htmlFor="partner">Производство-партнёр</Label>
              <Select
                value={partnerId || "none"}
                onValueChange={(value) => value && setPartnerId(value === "none" ? "" : value)}
                disabled={loadingPartners}
                items={Object.fromEntries([
                  ["none", "— Без партнёра —"],
                  ...partners.map((p) => [p.id, p.name]),
                ])}
              >
                <SelectTrigger id="partner">
                  <SelectValue placeholder={loadingPartners ? "Загрузка..." : "Выберите партнёра"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Без партнёра —</SelectItem>
                  {partners.map((p) => {
                    const tags: string[] = p.types
                      ? (Array.isArray(p.types) ? p.types as string[] : [])
                      : []
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {tags.length > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({tags.map(t => SKILL_TAG_LABELS[t] || t).join(", ")})
                          </span>
                        )}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {/* Show skill tags for selected partner */}
              {partnerSkillTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {partnerSkillTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {SKILL_TAG_LABELS[tag] || tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Material Mode */}
            <div className="grid gap-2">
              <Label htmlFor="materialMode">Режим материала</Label>
              <Select
                value={materialMode}
                onValueChange={(value) => value && setMaterialMode(value)}
                items={Object.fromEntries(MATERIAL_MODE_OPTIONS.map((o) => [o.value, o.label]))}
              >
                <SelectTrigger id="materialMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATERIAL_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Planned Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="plannedStartDate">Плановая дата начала</Label>
                <Input
                  id="plannedStartDate"
                  type="date"
                  value={plannedStartDate}
                  onChange={(e) => setPlannedStartDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="plannedEndDate">Плановая дата окончания</Label>
                <Input
                  id="plannedEndDate"
                  type="date"
                  value={plannedEndDate}
                  onChange={(e) => setPlannedEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Заметки</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Дополнительная информация о производстве..."
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
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
