"use client"

/**
 * Fetches the company brand (logo) for the app shell.
 * Shared by the Sidebar so the logo stays in sync after uploads.
 * Re-fetches on pathname change (e.g. after updating logo in settings).
 */
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export interface BrandInfo {
  logoFileId: string | null
  logoUrl: string | null
  fileName: string | null
}

export function useBrand() {
  const pathname = usePathname()
  const [brand, setBrand] = useState<BrandInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch("/api/settings/brand")
      .then((r) => r.json())
      .then((d: { data?: BrandInfo }) => {
        if (active) setBrand(d.data ?? null)
      })
      .catch(() => {
        if (active) setBrand(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [pathname])

  return { brand, loading }
}
