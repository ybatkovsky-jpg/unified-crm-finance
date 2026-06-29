"use client"

/**
 * Fetches the current user (name + role codes) for the app shell.
 * Shared by Sidebar and Topbar so both stay in sync with a single request.
 */
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export interface MeUser {
  id?: string
  name?: string
  email?: string
  roleCodes?: string[]
}

export function useMe() {
  const pathname = usePathname()
  const [me, setMe] = useState<MeUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: MeUser }) => {
        if (active) setMe(d.user ?? null)
      })
      .catch(() => {
        if (active) setMe(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [pathname])

  const isDirector = !!me?.roleCodes?.includes("director")
  return { me, loading, isDirector }
}
