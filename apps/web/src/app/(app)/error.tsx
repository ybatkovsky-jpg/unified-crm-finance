"use client"

import { useEffect } from "react"
import { RefreshCwIcon, AlertTriangleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Error boundary for authenticated app section (route group).
 * Catches render errors in any page under (app)/ and shows a retry UI.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App section error:", error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <AlertTriangleIcon className="size-12 text-destructive" />
        <h2 className="text-lg font-semibold">Что-то пошло не так</h2>
        <p className="text-sm text-muted-foreground">
          При загрузке страницы произошла ошибка. Попробуйте повторить.
        </p>
        <Button onClick={reset} variant="outline">
          <RefreshCwIcon className="size-4" />
          <span className="ml-1.5">Повторить</span>
        </Button>
      </div>
    </div>
  )
}
