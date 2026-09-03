"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

/**
 * Единое состояние ошибки с кнопкой «Повторить».
 */
export function ErrorState({
  title = "Не удалось загрузить данные",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center " +
        (className ?? "")
      }
    >
      <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {message && <p className="max-w-sm text-xs text-muted-foreground">{message}</p>}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  )
}
