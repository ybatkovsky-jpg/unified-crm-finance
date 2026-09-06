"use client"

import { useState, useEffect, useCallback } from "react"
import { CreditCard, Loader2, Check, Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { projectPaymentsApi, ApiClientError } from "@/lib/api/project-payments"
import type {
  ProjectPaymentData,
  PaymentCoverage,
  PaymentMethod,
  ProjectPaymentType,
} from "@/lib/api/types"

interface ProjectPaymentsCardProps {
  projectId: string
  onUpdate?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  prepayment: "Предоплата",
  final: "Финальная оплата",
  other: "Прочее",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  planned: "outline",
  partial: "default",
  paid: "secondary",
}

function formatRub(n: number): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(n)
}

export function ProjectPaymentsCard({ projectId, onUpdate }: ProjectPaymentsCardProps) {
  const [stages, setStages] = useState<ProjectPaymentData[]>([])
  const [coverage, setCoverage] = useState<PaymentCoverage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Фиксация платежа
  const [recordFor, setRecordFor] = useState<ProjectPaymentData | null>(null)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("bank")
  const [saving, setSaving] = useState(false)

  // Создание/редактирование этапа (% или сумма)
  const [stageForm, setStageForm] = useState<{ mode: "create" | "edit"; stage?: ProjectPaymentData } | null>(null)
  const [stageType, setStageType] = useState<ProjectPaymentType>("prepayment")
  const [planMode, setPlanMode] = useState<"percent" | "amount">("percent")
  const [planPercent, setPlanPercent] = useState("70")
  const [planAmount, setPlanAmount] = useState("")
  const [stageSaving, setStageSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [stagesRes, covRes] = await Promise.all([
        projectPaymentsApi.getPayments(projectId),
        projectPaymentsApi.getCoverage(projectId),
      ])
      setStages(stagesRes.data)
      setCoverage(covRes.data)
    } catch (err) {
      console.error("Failed to fetch project payments:", err)
      setError("Не удалось загрузить платежи клиента")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openRecord = (stage: ProjectPaymentData) => {
    setRecordFor(stage)
    const remaining = Number(stage.plannedAmount) - Number(stage.receivedAmount)
    setAmount(remaining > 0 ? String(Math.round(remaining * 100) / 100) : "")
    setMethod((stage.paymentMethod as PaymentMethod) || "bank")
  }

  const handleRecord = async () => {
    if (!recordFor) return
    const value = parseFloat(amount)
    if (!value || value <= 0) {
      setError("Введите положительную сумму")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await projectPaymentsApi.recordPayment(recordFor.id, {
        amount: value,
        paymentMethod: method,
      })
      setRecordFor(null)
      await fetchData()
      onUpdate?.()
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message)
      else setError("Не удалось зафиксировать платёж")
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => {
    setStageType("prepayment")
    setPlanMode("percent")
    setPlanPercent("70")
    setPlanAmount("")
    setStageForm({ mode: "create" })
  }

  const openEdit = (stage: ProjectPaymentData) => {
    setStageType(stage.paymentType as ProjectPaymentType)
    setPlanPercent(String(Math.round((stage.plannedPercent || 0) * 100)))
    setPlanAmount(String(Number(stage.plannedAmount) || ""))
    setPlanMode(stage.plannedPercent > 0 ? "percent" : "amount")
    setStageForm({ mode: "edit", stage })
  }

  const handleStageSubmit = async () => {
    if (!stageForm) return
    setStageSaving(true)
    setError(null)
    try {
      if (stageForm.mode === "create") {
        await projectPaymentsApi.createPayment(projectId, {
          paymentType: stageType,
          ...(planMode === "percent"
            ? { plannedPercent: parseFloat(planPercent) / 100 }
            : { plannedAmount: parseFloat(planAmount) }),
        })
      } else if (stageForm.stage) {
        await projectPaymentsApi.updatePayment(stageForm.stage.id, {
          paymentType: stageType,
          ...(planMode === "percent"
            ? { plannedPercent: parseFloat(planPercent) / 100 }
            : { plannedAmount: parseFloat(planAmount) }),
        })
      }
      setStageForm(null)
      await fetchData()
      onUpdate?.()
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message)
      else setError("Не удалось сохранить этап")
    } finally {
      setStageSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && stages.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>
          Попробовать снова
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{error}</div>
      )}

      {/* Покрытие проекта */}
      {coverage && (
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div>
            <p className="text-sm text-muted-foreground">Получено</p>
            <p className="font-medium">{formatRub(coverage.received)} из {formatRub(coverage.total)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{Math.min(coverage.percent, 999)}%</Badge>
            {coverage.prepaymentMet && (
              <Badge variant="secondary">Предоплата получена — можно монтаж</Badge>
            )}
            {coverage.fullyPaid && <Badge variant="default">Полностью оплачено</Badge>}
          </div>
        </div>
      )}

      {/* Этапы */}
      <div className="space-y-3">
        {stages.map((stage) => {
          const percent = stage.plannedAmount > 0
            ? Math.min(100, Math.round((Number(stage.receivedAmount) / Number(stage.plannedAmount)) * 100))
            : 0
          return (
            <div key={stage.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{TYPE_LABELS[stage.paymentType] || stage.paymentType}</span>
                  <Badge variant={STATUS_VARIANTS[stage.status] || "outline"}>
                    {stage.status === "paid" ? "Оплачено" : stage.status === "partial" ? "Частично" : "Ожидает"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(stage)}>
                    <Pencil className="size-3 mr-1" />
                    Изменить
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openRecord(stage)}>
                    <CreditCard className="size-3 mr-1" />
                    Платёж
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{formatRub(Number(stage.receivedAmount))} из {formatRub(Number(stage.plannedAmount))}</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-[width] duration-500 ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Button variant="outline" size="sm" onClick={openCreate}>
        <Plus className="size-3.5 mr-1" />
        Добавить этап оплаты
      </Button>

      {/* Диалог фиксации платежа */}
      <Dialog open={recordFor !== null} onOpenChange={(o) => !o && setRecordFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Зафиксировать платёж</DialogTitle>
            <DialogDescription>
              {recordFor && (TYPE_LABELS[recordFor.paymentType] || recordFor.paymentType)}
              {recordFor && ` — получено ${formatRub(Number(recordFor.receivedAmount))} из ${formatRub(Number(recordFor.plannedAmount))}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="pay-amount">Сумма, ₽</Label>
              <Input
                id="pay-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Способ оплаты</Label>
              <Select value={method} onValueChange={(v) => setMethod((v ?? "bank") as PaymentMethod)} items={{ bank: "Безналичный (банк)", cash: "Наличные", card: "Карта / эквайринг" }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Безналичный (банк)</SelectItem>
                  <SelectItem value="cash">Наличные</SelectItem>
                  <SelectItem value="card">Карта / эквайринг</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordFor(null)}>Отмена</Button>
            <Button onClick={handleRecord} disabled={saving}>
              <Check className="size-3 mr-1" />
              {saving ? "Сохранение..." : "Зафиксировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания/редактирования этапа */}
      <Dialog open={stageForm !== null} onOpenChange={(o) => !o && setStageForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{stageForm?.mode === "edit" ? "Изменить этап оплаты" : "Новый этап оплаты"}</DialogTitle>
            <DialogDescription>Задайте плановую сумму в процентах или фиксированной суммой.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Тип этапа</Label>
              <Select value={stageType} onValueChange={(v) => setStageType((v ?? "prepayment") as ProjectPaymentType)} items={{ prepayment: "Предоплата", final: "Финальная оплата", other: "Прочее" }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prepayment">Предоплата</SelectItem>
                  <SelectItem value="final">Финальная оплата</SelectItem>
                  <SelectItem value="other">Прочее</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>План задаётся</Label>
              <Select value={planMode} onValueChange={(v) => setPlanMode((v ?? "percent") as "percent" | "amount")} items={{ percent: "В процентах", amount: "Фиксированной суммой" }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">В процентах</SelectItem>
                  <SelectItem value="amount">Фиксированной суммой</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {planMode === "percent" ? (
              <div className="grid gap-2">
                <Label htmlFor="plan-percent">Процент, %</Label>
                <Input id="plan-percent" type="number" min="0" max="100" step="1" value={planPercent} onChange={(e) => setPlanPercent(e.target.value)} />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="plan-amount">Сумма, ₽</Label>
                <Input id="plan-amount" type="number" min="0" step="0.01" value={planAmount} onChange={(e) => setPlanAmount(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageForm(null)}>Отмена</Button>
            <Button onClick={handleStageSubmit} disabled={stageSaving}>
              {stageSaving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
