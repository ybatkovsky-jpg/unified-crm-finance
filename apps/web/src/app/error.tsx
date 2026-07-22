"use client"

import { useEffect } from "react"
import { RefreshCwIcon, AlertTriangleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Root-level error boundary for the entire application.
 * Catches render errors outside of the (app) route group (login page, etc.).
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Root error:", error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <AlertTriangleIcon className="size-12 text-destructive" />
        <h2 className="text-lg font-semibold">Критическая ошибка</h2>
        <p className="text-sm text-muted-foreground">
          Произошла непредвиденная ошибка. Попробуйте обновить страницу.
        </p>
        <Button onClick={reset} variant="outline">
          <RefreshCwIcon className="size-4" />
          <span className="ml-1.5">Повторить</span>
        </Button>
      </div>
    </div>
  )
}
