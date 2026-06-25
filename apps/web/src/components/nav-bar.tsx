"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

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
      </nav>
    </header>
  )
}
