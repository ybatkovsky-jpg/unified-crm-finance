"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { NotificationBell } from "@/components/notification-bell"

const navItems = [
  { label: "Контакты", href: "/crm/contacts" },
  { label: "Сделки", href: "/deals" },
  { label: "Проекты", href: "/projects" },
  { label: "Договоры", href: "/contracts" },
  { label: "Контрагенты", href: "/procurement/counterparties" },
  { label: "Заявки", href: "/procurement/purchase-requests" },
  { label: "Счета", href: "/procurement/invoices" },
  { label: "Согласование", href: "/procurement/approvals" },
  { label: "Склад", href: "/procurement/warehouse" },
  { label: "Поставки", href: "/procurement/deliveries" },
  { label: "Финансы", href: "/finance" },
  { label: "Категории", href: "/finance/categories" },
  { label: "Транзакции", href: "/finance/transactions" },
  { label: "Платежи", href: "/finance/payments" },
  { label: "Аналитика", href: "/analytics" },
]

export function NavBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<{ name?: string; roleCode?: string } | null>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: { name?: string; roleCode?: string } }) => setMe(d.user ?? null))
      .catch(() => setMe(null))
  }, [pathname])

  // На странице входа навигация не нужна
  if (pathname === "/login") return null

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <nav className="container mx-auto flex items-center gap-1 px-6 h-12">
        <Link
          href="/"
          className="mr-4 font-semibold text-sm tracking-tight"
        >
          Единая CRM
        </Link>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({
                  variant: isActive ? "secondary" : "ghost",
                  size: "sm",
                })
              )}
            >
              {item.label}
            </Link>
          )
        })}
        <div className="flex-1" />
        <NotificationBell />
        {me?.roleCode === "director" && (
          <Link
            href="/settings/users"
            className={cn(
              buttonVariants({
                variant: pathname.startsWith("/settings") ? "secondary" : "ghost",
                size: "sm",
              })
            )}
          >
            Пользователи
          </Link>
        )}
        {me?.name && (
          <span className="text-xs text-muted-foreground hidden sm:inline">{me.name}</span>
        )}
        <button
          onClick={handleLogout}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          Выйти
        </button>
      </nav>
    </header>
  )
}
