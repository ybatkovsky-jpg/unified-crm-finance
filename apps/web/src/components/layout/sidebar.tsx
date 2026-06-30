"use client"

/**
 * Fixed left sidebar for the app shell.
 *
 * - Desktop: persistent, collapsible to an icon-only rail (state persisted to
 *   localStorage). Active section is highlighted with a spring-animated pill
 *   (framer-motion layoutId).
 * - Mobile: a slide-in drawer toggled from the Topbar burger.
 */
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sofa, ChevronsLeft, ChevronsRight, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { NAV_SECTIONS, getActiveSection } from "./nav-config"
import { SECTION_HOME } from "./section-home"
import { useMe } from "./use-me"

const COLLAPSE_KEY = "pm.sidebar.collapsed"

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const pathname = usePathname()
  const { isDirector } = useMe()

  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Restore collapsed preference + only animate after mount (avoid SSR flash).
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1")
    setMounted(true)
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0")
  }

  const sections = NAV_SECTIONS.filter((s) => (s.directorOnly ? isDirector : true))
  const activeSection = getActiveSection(pathname, isDirector)

  const content = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link
        href="/"
        className={cn(
          "flex h-[var(--topbar-height)] shrink-0 items-center gap-2.5 border-b px-4",
          collapsed && "justify-center px-0"
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sofa className="size-4.5" />
        </span>
        {!collapsed && (
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">ПРО Мебель</span>
            <span className="text-[10px] text-muted-foreground">ERP / CRM</span>
          </span>
        )}
      </Link>

      {/* Sections */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2.5">
        {sections.map((section) => {
          const isActive = activeSection.id === section.id
          const Icon = section.icon
          return (
              <Link
              key={section.id}
              href={SECTION_HOME[section.id] ?? section.children[0].href}
              title={collapsed ? section.label : undefined}
              className={cn(
                "group/section relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {/* Active pill (spring-animated, shared layoutId) */}
              {isActive && mounted && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-sidebar-primary shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="relative size-4.5 shrink-0" />
              {!collapsed && <span className="relative truncate">{section.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden shrink-0 border-t p-2.5 lg:block">
        <button
          onClick={toggleCollapse}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          {!collapsed && <span>Свернуть</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar: fixed, width reacts to collapsed state */}
      <aside
        data-slot="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r bg-sidebar lg:block",
          "transition-[width] duration-200 ease-out"
        )}
        style={{ width: collapsed ? "var(--sidebar-width-collapsed)" : "var(--sidebar-width)" }}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              data-slot="sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] border-r bg-sidebar lg:hidden"
            >
              <button
                onClick={onMobileClose}
                className="absolute right-3 top-3 grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
                aria-label="Закрыть меню"
              >
                <X className="size-4" />
              </button>
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
