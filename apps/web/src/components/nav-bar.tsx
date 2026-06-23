"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const navItems = [
  { label: "CRM", href: "/crm/contacts" },
  { label: "Deals", href: "/deals" },
  { label: "Projects", href: "/projects" },
  { label: "Contracts", href: "/contracts" },
  { label: "Procurement", href: "/procurement/counterparties" },
  { label: "Requests", href: "/procurement/purchase-requests" },
  { label: "Invoices", href: "/procurement/invoices" },
  { label: "Approvals", href: "/procurement/approvals" },
  { label: "Warehouse", href: "/procurement/warehouse" },
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
          Unified CRM
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
      </nav>
    </header>
  )
}
