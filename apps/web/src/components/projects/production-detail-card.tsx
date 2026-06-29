"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Play, Check, Edit2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { productionsApi } from "@/lib/api/productions"
import type { ProductionData } from "@/lib/api/types"

interface ProductionDetailCardProps {
  production: ProductionData
  onUpdate?: (production: ProductionData) => void
}

const STATUS_LABELS: Record<string, string> = {
  planning: "Планирование",
  active: "В работе",
  completed: "Завершено",
  paused: "На паузе",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  planning: "outline",
  active: "default",
  completed: "secondary",
  paused: "outline",
}

const TYPE_LABELS: Record<string, string> = {
  PLATE: "Плитные материалы",
  COUNTERTOP: "Столешницы",
}

const MATERIAL_MODE_LABELS: Record<string, string> = {
  our_materials: "Из наших материалов",
  partner_materials: "Из материала партнёра",
}

const STAGE_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  in_progress: "В работе",
  completed: "Завершён",
  blocked: "Заблокирован",
}

const STAGE_STATUS_COLORS: Record<string, string> = {
  pending: "text-muted-foreground",
  in_progress: "text-blue-600",
  completed: "text-green-600",
  blocked: "text-red-600",
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-"
  if (date instanceof Date) return date.toLocaleDateString("ru-RU")
  return new Date(date).toLocaleDateString("ru-RU")
}

export function ProductionDetailCard({ production, onUpdate }: ProductionDetailCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<"start" | "complete" | null>(null)

  // Edit form state
  const [notes, setNotes] = useState(production.notes || "")
  const [plannedStartDate, setPlannedStartDate] = useState(
    production.plannedStartDate ? new Date(production.plannedStartDate).toISOString().split("T")[0] : ""
  )
  const [plannedEndDate, setPlannedEndDate] = useState(
    production.plannedEndDate ? new Date(production.plannedEndDate).toISOString().split("T")[0] : ""
  )

  const getTypeLabel = (): string => {
    const type = (production.attributes as any)?.type as string | undefined
    return type ? TYPE_LABELS[type] || type : "Производство"
  }

  const handleStart = async () => {
    setActionLoading("start")
    try {
      const response = await productionsApi.updateProduction(production.id, {
        status: "active",
        actualStartDate: new Date().toISOString(),
      })
      onUpdate?.(response.data)
    } catch (err) {
      console.error("Failed to start production:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleComplete = async () => {
    setActionLoading("complete")
    try {
      const response = await productionsApi.updateProduction(production.id, {
        status: "completed",
        progress: 100,
        actualEndDate: new Date().toISOString(),
      })
      onUpdate?.(response.data)
    } catch (err) {
      console.error("Failed to complete production:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusChange = async (value: string | null) => {
    if (!value) return
    const newStatus = value
    setLoading(true)
    try {
      const response = await productionsApi.updateProduction(production.id, {
        status: newStatus,
      })
      onUpdate?.(response.data)
    } catch (err) {
      console.error("Failed to update status:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    setLoading(true)
    try {
      const response = await productionsApi.updateProduction(production.id, {
        notes: notes || undefined,
        plannedStartDate: plannedStartDate || undefined,
        plannedEndDate: plannedEndDate || undefined,
      })
      onUpdate?.(response.data)
      setEditing(false)
    } catch (err) {
      console.error("Failed to update production:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setNotes(production.notes || "")
    setPlannedStartDate(
      production.plannedStartDate ? new Date(production.plannedStartDate).toISOString().split("T")[0] : ""
    )
    setPlannedEndDate(
      production.plannedEndDate ? new Date(production.plannedEndDate).toISOString().split("T")[0] : ""
    )
    setEditing(false)
  }

  const canStart = production.status === "planning"
  const canComplete = production.status === "active"

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header - Always Visible */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{getTypeLabel()}</Badge>
            {production.materialMode && (
              <Badge variant="outline" className="text-xs">
                {MATERIAL_MODE_LABELS[production.materialMode] || production.materialMode}
              </Badge>
            )}
            <Badge variant={STATUS_VARIANTS[production.status] || "outline"}>
              {STATUS_LABELS[production.status] || production.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {/* Quick Actions */}
            {canStart && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStart}
                disabled={actionLoading === "start"}
              >
                <Play className="size-3 mr-1" />
                Начать
              </Button>
            )}
            {canComplete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleComplete}
                disabled={actionLoading === "complete"}
              >
                <Check className="size-3 mr-1" />
                Завершить
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>
        </div>

        {/* Partner Info */}
        {(production as any).Counterparty && (
          <div className="text-sm">
            <span className="text-muted-foreground">Партнёр: </span>
            <span className="font-medium">{(production as any).Counterparty.name}</span>
            {(production as any).Counterparty.contactPerson && (
              <span className="text-muted-foreground ml-2">
                ({(production as any).Counterparty.contactPerson})
              </span>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {production.progress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Прогресс</span>
              <span>{Math.round(production.progress)}%</span>
            </div>
            <Progress value={production.progress} className="h-2" />
          </div>
        )}

        {/* Stage Summary */}
        {production.ProductionStage && production.ProductionStage.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">Этапы:</span>
            {production.ProductionStage.map((stage: any) => {
              const statusColors: Record<string, string> = {
                pending: "bg-muted",
                in_progress: "bg-blue-500",
                completed: "bg-green-500",
                blocked: "bg-red-500",
              }
              const colorClass = statusColors[stage.status] || "bg-muted"
              return (
                <div
                  key={stage.id}
                  className={`w-2 h-2 rounded-full ${colorClass}`}
                  title={`${stage.name} (${stage.status})`}
                />
              )
            })}
            <span className="text-xs text-muted-foreground">
              {production.ProductionStage.filter((s: any) => s.status === "completed").length} /
              {production.ProductionStage.length}
            </span>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t bg-muted/30 p-4 space-y-4">
          {/* Edit/Save Actions */}
          <div className="flex justify-end">
            {editing ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="size-3 mr-1" />
                  Отмена
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={loading}>
                  <Save className="size-3 mr-1" />
                  {loading ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit2 className="size-3 mr-1" />
                Изменить
              </Button>
            )}
          </div>

          {/* Edit Form or Display */}
          {editing ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Плановая дата начала</label>
                  <Input
                    type="date"
                    value={plannedStartDate}
                    onChange={(e) => setPlannedStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Плановая дата окончания</label>
                  <Input
                    type="date"
                    value={plannedEndDate}
                    onChange={(e) => setPlannedEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Заметки</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Дополнительная информация..."
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">План. начало:</span>{" "}
                  <span className="font-medium">{formatDate(production.plannedStartDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">План. окончание:</span>{" "}
                  <span className="font-medium">{formatDate(production.plannedEndDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Факт. начало:</span>{" "}
                  <span className="font-medium">{formatDate(production.actualStartDate)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Факт. окончание:</span>{" "}
                  <span className="font-medium">{formatDate(production.actualEndDate)}</span>
                </div>
              </div>

              {/* Notes */}
              {production.notes && (
                <div>
                  <span className="text-sm text-muted-foreground">Заметки:</span>
                  <p className="text-sm mt-1">{production.notes}</p>
                </div>
              )}

              {/* Status Change Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Изменить статус:</span>
                <Select
                  value={production.status}
                  onValueChange={handleStatusChange}
                  disabled={loading}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Stages List */}
          {production.ProductionStage && production.ProductionStage.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Этапы производства</h4>
              <div className="space-y-2">
                {production.ProductionStage.map((stage: any) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between p-2 bg-background rounded border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">{stage.order}.</span>
                      <span className="text-sm font-medium">{stage.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${STAGE_STATUS_COLORS[stage.status] || ""}`}
                      >
                        {STAGE_STATUS_LABELS[stage.status] || stage.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {stage.startDate || stage.endDate ? (
                        <>
                          {formatDate(stage.startDate)}
                          {stage.startDate && stage.endDate && " — "}
                          {formatDate(stage.endDate)}
                        </>
                      ) : (
                        "-"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
