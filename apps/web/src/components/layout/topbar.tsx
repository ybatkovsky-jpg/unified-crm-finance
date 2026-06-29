"use client"

/**
 * Top bar: active-section title + sub-nav (child page links), with the
 * notification bell, theme toggle, and user menu on the right. On mobile the
 * sub-nav collapses into a horizontal scroll and a burger opens the Sidebar.
 */
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, LogOut, User as UserIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeToggle } from "./theme-toggle"
import { getActiveSection } from "./nav-config"
import { useMe } from "./use-me"

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { me, isDirector } = useMe()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeSection = getActiveSection(pathname, isDirector)

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <header
      className="sticky top-0 z-20 flex h-[var(--topbar-height)] items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md"
    >
      {/* Mobile burger */}
      <button
        onClick={onOpenMobile}
        className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Открыть меню"
      >
        <Menu className="size-5" />
      </button>

      {/* Section title + sub-nav */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="hidden shrink-0 text-sm font-semibold tracking-tight sm:block">
          {activeSection.label}
        </span>

        {/* Sub-nav: child page links, animated on section change */}
        <div className="relative min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.nav
              key={activeSection.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {activeSection.children.map((child) => {
                const isActive =
                  pathname === child.href || pathname.startsWith(child.href + "/")
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
                      "shrink-0"
                    )}
                  >
                    {child.label}
                  </Link>
                )
              })}
            </motion.nav>
          </AnimatePresence>
        </div>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <NotificationBell />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-muted"
          >
            <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="size-4" />
            </span>
            {me?.name && (
              <span className="hidden max-w-28 truncate text-xs font-medium sm:block">
                {me.name}
              </span>
            )}
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.14, ease: "easeOut" }}
                className="absolute right-0 top-full mt-1.5 w-52 overflow-hidden rounded-lg border bg-popover shadow-lg"
              >
                <div className="border-b px-3 py-2.5">
                  <p className="truncate text-sm font-medium">{me?.name ?? "Пользователь"}</p>
                  {me?.email && (
                    <p className="truncate text-xs text-muted-foreground">{me.email}</p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="size-4" />
                  Выйти
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
