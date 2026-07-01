"use client"

/**
 * App shell: composes the Sidebar (fixed) + Topbar (sticky) and manages the
 * mobile-drawer open state. The content offset is handled by the (app) layout
 * via CSS so this component is purely interactive chrome.
 */
import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex min-h-dvh flex-col bg-gradient-to-br from-indigo-50/60 via-background to-background dark:from-indigo-950/20 lg:pl-[var(--sidebar-width)]">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </>
  )
}
