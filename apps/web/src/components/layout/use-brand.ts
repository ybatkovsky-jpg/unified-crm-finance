"use client"

/**
 * Fetches the company brand (logo) for the app shell.
 * Shared by the Sidebar so the logo stays in sync after uploads.
 * Re-fetches on pathname change AND on "brand-updated" custom event
 * (dispatched from settings page after logo upload).
 */
import { useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"

export interface BrandInfo {
  logoFileId: string | null
  logoUrl: string | null
  fileName: string | null
}

/** Dispatch this event after logo upload/delete to refresh the sidebar. */
export function notifyBrandUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("brand-updated"))
  }
}

export function useBrand() {
  const pathname = usePathname()
  const [brand, setBrand] = useState<BrandInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const fetchBrand = useCallback(() => {
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
    return () => { active = false }
  }, [])

  // Re-fetch on pathname change
  useEffect(() => {
    return fetchBrand()
  }, [pathname, fetchBrand])

  // Re-fetch on custom "brand-updated" event
  useEffect(() => {
    const handler = () => setTick((t) => t + 1)
    window.addEventListener("brand-updated", handler)
    return () => window.removeEventListener("brand-updated", handler)
  }, [])

  // Actually re-fetch when tick changes
  useEffect(() => {
    if (tick > 0) {
      return fetchBrand()
    }
  }, [tick, fetchBrand])

  return { brand, loading }
}
