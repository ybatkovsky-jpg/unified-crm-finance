"use client"

import { useState, useEffect } from "react"
import { FileText, Loader2, Check, Trash2 } from "lucide-react"
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
import { changeOrdersApi } from "@/lib/api/change-orders"
import type { ChangeOrderData } from "@/lib/api/types"

interface ChangeOrderListProps {
  projectId: string
  canEdit?: boolean
  onUpdate?: () => void
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  approved: "Утверждён",
  completed: "Выполнен",
  cancelled: "Отменён",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "outline",
  approved: "default",
  completed: "secondary",
  cancelled: "destructive",
}

export function ChangeOrderList({ projectId, canEdit = true, onUpdate }: ChangeOrderListProps) {
  const [items, setItems] = useState<ChangeOrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await changeOrdersApi.getChangeOrders(projectId)
      setItems(response.data)
    } catch (err) {
      console.error("Failed to fetch change orders:", err)
      setError("Не удалось загрузить доп. работы")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [projectId])

  const handleApprove = async (id: string) => {
    setActingId(id)
    try {
      await changeOrdersApi.updateChangeOrder(id, { status: "approved" })
      fetchItems()
      onUpdate?.()
    } catch (err) {
      console.error("Failed to approve:", err)
    } finally {
      setActingId(null)
    }
  }

  const handleComplete = async (id: string) => {
    setActingId(id)
    try {
      await changeOrdersApi.updateChangeOrder(id, { status: "completed" })
      fetchItems()
      onUpdate?.()
    } catch (err) {
      console.error("Failed to complete:", err)
    } finally {
      setActingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await changeOrdersApi.deleteChangeOrder(deleteId)
      fetchItems()
      setDeleteId(null)
      onUpdate?.()
    } catch (err) {
      console.error("Failed to delete change order:", err)
    }
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
        <FileText className="size-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Нет доп. работ</p>
        <p className="text-sm text-muted-foreground">
          Доп. работы оформляются при изменении объёма по инициативе клиента
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">Доп. работа #{item.number}</span>
              <Badge variant={STATUS_VARIANTS[item.status] || "outline"}>
                {STATUS_LABELS[item.status] || item.status}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {item.status === "draft" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApprove(item.id)}
                  disabled={actingId === item.id}
                >
                  <Check className="size-3 mr-1" />
                  Утвердить
                </Button>
              )}
              {item.status === "approved" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleComplete(item.id)}
                  disabled={actingId === item.id}
                >
                  <Check className="size-3 mr-1" />
                  Выполнено
                </Button>
              )}
              {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(item.id)}
              >
                <Trash2 className="size-4" />
              </Button>
              )}
            </div>
          </div>

          <h4 className="text-sm font-medium">{item.title}</h4>

          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium">{item.amount.toLocaleString("ru-RU")} ₽</span>
            {item.Contract && (
              <span className="text-muted-foreground">
                Договор: {item.Contract.number || item.Contract.title}
              </span>
            )}
          </div>

          {item.notes && (
            <p className="text-xs text-muted-foreground">{item.notes}</p>
          )}
        </div>
      ))}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить доп. работу?</AlertDialogTitle>
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
