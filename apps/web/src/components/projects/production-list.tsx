"use client"

import { useState, useEffect } from "react"
import { Trash2, Loader2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { productionsApi } from "@/lib/api/productions"
import type { ProductionData } from "@/lib/api/types"

interface ProductionListProps {
  projectId: string
  onUpdate?: () => void
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
  our_materials: "Наши материалы",
  partner_materials: "Материал партнёра",
}

const STAGE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  blocked: "bg-red-500",
}

function getStageStatusColor(status: string): string {
  return STAGE_STATUS_COLORS[status] || STAGE_STATUS_COLORS.pending
}

export function ProductionList({ projectId, onUpdate }: ProductionListProps) {
  const [productions, setProductions] = useState<ProductionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProductions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await productionsApi.getProductions(projectId)
      setProductions(response.data)
    } catch (err) {
      console.error("Failed to fetch productions:", err)
      setError("Не удалось загрузить производства")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductions()
  }, [projectId])

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      await productionsApi.deleteProduction(deleteId)
      setProductions((prev) => prev.filter((p) => p.id !== deleteId))
      setDeleteId(null)
      onUpdate?.()
    } catch (err) {
      console.error("Failed to delete production:", err)
      setError("Не удалось удалить производство")
    } finally {
      setDeleting(false)
    }
  }

  const getTypeLabel = (production: ProductionData): string => {
    const type = (production.attributes as any)?.type as string | undefined
    return type ? TYPE_LABELS[type] || type : "Производство"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchProductions}>
          Попробовать снова
        </Button>
      </div>
    )
  }

  if (productions.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="size-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Нет производств</p>
        <p className="text-sm text-muted-foreground">
          Добавьте первое производство для отслеживания этапов изготовления
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {productions.map((production) => (
        <div
          key={production.id}
          className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
        >
          {/* Header: Type, Status, Actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{getTypeLabel(production)}</Badge>
              {production.materialMode && (
                <Badge variant="outline" className="text-xs">
                  {MATERIAL_MODE_LABELS[production.materialMode] || production.materialMode}
                </Badge>
              )}
              <Badge variant={STATUS_VARIANTS[production.status] || "outline"}>
                {STATUS_LABELS[production.status] || production.status}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => setDeleteId(production.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>

          {/* Partner Info */}
          {(production as any).Counterparty && (
            <div className="text-sm text-muted-foreground">
              Партнёр: <span className="font-medium text-foreground">{(production as any).Counterparty.name}</span>
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

          {/* Stage Indicators */}
          {production.ProductionStage && production.ProductionStage.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground">Этапы:</span>
              {production.ProductionStage.map((stage: any) => (
                <div
                  key={stage.id}
                  className={`w-2 h-2 rounded-full ${getStageStatusColor(stage.status)}`}
                  title={`${stage.name} (${stage.status})`}
                />
              ))}
              <span className="text-xs text-muted-foreground">
                {production.ProductionStage.filter((s: any) => s.status === "completed").length} /
                {production.ProductionStage.length}
              </span>
            </div>
          )}

          {/* Dates */}
          {(production.plannedStartDate || production.plannedEndDate) && (
            <div className="text-xs text-muted-foreground">
              {production.plannedStartDate && (
                <span className="mr-3">
                  План: с {new Date(production.plannedStartDate).toLocaleDateString("ru-RU")}
                </span>
              )}
              {production.plannedEndDate && (
                <span>
                  по {new Date(production.plannedEndDate).toLocaleDateString("ru-RU")}
                </span>
              )}
            </div>
          )}

          {/* Notes */}
          {production.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">{production.notes}</p>
          )}
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить производство?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все этапы производства также будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
