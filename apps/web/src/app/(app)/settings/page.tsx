"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * /settings redirects to /settings/general — the only meaningful landing page
 * for the Settings section (just General + Users sub-pages).
 */
export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/settings/general")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Настройки...</span>
      </div>
    </div>
  )
}
