"use client"

import { useState, useEffect } from "react"
import { Wrench, Loader2, Play, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { installationsApi } from "@/lib/api/installations"
import type { InstallationData } from "@/lib/api/types"

interface InstallationListProps {
  projectId: string
  onUpdate?: () => void
}

const STATUS_LABELS: Record<string, string> = {
  planned: "Запланирован",
  advance_paid: "Аванс получен",
  started: "Приступили",
  completed: "Завершён",
  cancelled: "Отменён",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  planned: "outline",
  advance_paid: "secondary",
  started: "default",
  completed: "secondary",
  cancelled: "destructive",
}

function formatDate(date: string | null): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("ru-RU")
}

export function InstallationList({ projectId, onUpdate }: InstallationListProps) {
  const [items, setItems] = useState<InstallationData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await installationsApi.getInstallations(projectId)
      setItems(response.data)
    } catch (err) {
      console.error("Failed to fetch installations:", err)
      setError("Не удалось загрузить монтажи")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [projectId])

  const handleStatusChange = async (id: string, status: string) => {
    setActingId(id)
    try {
      await installationsApi.updateStatus(id, status as any)
      fetchItems()
      onUpdate?.()
    } catch (err) {
      console.error("Failed to change status:", err)
    } finally {
      setActingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await installationsApi.deleteInstallation(deleteId)
      fetchItems()
      setDeleteId(null)
      onUpdate?.()
    } catch (err) {
      console.error("Failed to delete installation:", err)
    }
  }

  const getNextStatus = (item: InstallationData): string | null => {
    const transitions: Record<string, string> = {
      planned: "advance_paid",
      advance_paid: "started",
      started: "completed",
    }
    return transitions[item.status] || null
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
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchItems}>
          Попробовать снова
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <Wrench className="size-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Нет монтажей</p>
        <p className="text-sm text-muted-foreground">
          Добавьте заход на монтаж для отслеживания прогресса
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const nextStatus = getNextStatus(item)
        return (
          <div
            key={item.id}
            className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">Заход #{item.number}</span>
                <Badge variant={STATUS_VARIANTS[item.status] || "outline"}>
                  {STATUS_LABELS[item.status] || item.status}
                </Badge>
                {item.advancePercent > 0 && item.status === "planned" && (
                  <Badge variant="outline" className="text-xs">
                    Аванс {item.advancePercent}%
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {nextStatus && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(item.id, nextStatus)}
                    disabled={actingId === item.id}
                  >
                    {nextStatus === "advance_paid" && <><Check className="size-3 mr-1" />Аванс</>}
                    {nextStatus === "started" && <><Play className="size-3 mr-1" />Начать</>}
                    {nextStatus === "completed" && <><Check className="size-3 mr-1" />Завершить</>}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">План: </span>
                {formatDate(item.plannedStartDate)}
              </div>
              <div>
                <span className="text-muted-foreground">Факт. начало: </span>
                {formatDate(item.actualStartDate)}
              </div>
              {item.cost != null && (
                <div>
                  <span className="text-muted-foreground">Стоимость: </span>
                  {item.cost.toLocaleString("ru-RU")} ₽
                </div>
              )}
              {item.advanceAmount != null && (
                <div>
                  <span className="text-muted-foreground">Аванс: </span>
                  {item.advanceAmount.toLocaleString("ru-RU")} ₽
                </div>
              )}
            </div>

            {item.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">{item.notes}</p>
            )}

            {item.InstallationWorker && item.InstallationWorker.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Монтажники: </span>
                {item.InstallationWorker.map((w) => (
                  <Badge key={w.id} variant="secondary" className="text-xs">
                    {w.User?.name || w.userId}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      })}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить монтаж?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
