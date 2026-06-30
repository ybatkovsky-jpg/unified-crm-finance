"use client"

import { Badge } from "@/components/ui/badge"
import { CalendarDays, User } from "lucide-react"
import Link from "next/link"
import type { DealData } from "@/lib/api/types"
import { getDeadlineInfo, formatDeadlineLabel, cn } from "@/lib/utils"

interface DealCardProps {
  deal: DealData
  isDragging?: boolean
}

const DEADLINE_STYLES: Record<string, string> = {
  overdue: "bg-red-500/15 text-red-600 dark:text-red-400",
  soon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  upcoming: "bg-muted text-muted-foreground",
}

function formatAmount(amount: number, currency: string): string {
  const formatted = amount.toLocaleString("ru-RU", { maximumFractionDigits: 0 })
  return currency === "RUB" ? `${formatted} ₽` : `${formatted} ${currency}`
}

export function DealCard({ deal, isDragging }: DealCardProps) {
  const deadline = getDeadlineInfo(deal.expectedCloseDate)
  const projectDeadline = deal.project?.endDate ? getDeadlineInfo(deal.project.endDate) : null
  const activeDeadline = projectDeadline ?? deadline
  const endDate = deal.project?.endDate ?? deal.expectedCloseDate

  return (
    <Link href={`/deals/${deal.id}`} className="block group">
      <div
        className={cn(
          "rounded-lg border bg-card p-2.5 transition-all duration-150",
          "hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5",
          "group-active:cursor-grabbing",
          isDragging && "opacity-40 scale-95 shadow-lg ring-2 ring-primary/50"
        )}
      >
        {/* Title + amount */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-sm font-medium line-clamp-2 leading-snug">
            {deal.title}
          </span>
        </div>

        {Number(deal.amount) > 0 && (
          <div className="text-sm font-bold tabular-nums text-foreground mb-1.5">
            {formatAmount(Number(deal.amount), deal.currency)}
          </div>
        )}

        {/* Tags row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          <span className="text-[10px] font-mono text-muted-foreground/70">
            {deal.number}
          </span>
          {deal.source && (
            <Badge variant="outline" className="text-[9px] font-normal h-4 px-1">
              {deal.source.name}
            </Badge>
          )}
        </div>

        {/* Contact */}
        {deal.contact && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
            <User className="size-3 shrink-0" />
            <span className="line-clamp-1">
              {deal.contact.type === "company"
                ? deal.contact.companyName || "—"
                : [deal.contact.firstName, deal.contact.lastName].filter(Boolean).join(" ") || "—"}
            </span>
          </div>
        )}

        {/* Deadline */}
        {endDate && activeDeadline && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <CalendarDays className="size-3 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground tabular-nums">
              {new Date(endDate).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
            </span>
            {deal.project?.externalNumber && (
              <span className="text-muted-foreground/60">· {deal.project.externalNumber}</span>
            )}
            <span
              className={cn(
                "ml-auto rounded px-1 py-0.5 text-[9px] font-medium",
                DEADLINE_STYLES[activeDeadline.level]
              )}
            >
              {formatDeadlineLabel(activeDeadline)}
            </span>
          </div>
        )}

        {/* Manager */}
        {deal.manager && (
          <div className="mt-1.5 pt-1.5 border-t">
            <span className="text-[10px] text-muted-foreground">
              {deal.manager.name || deal.manager.email || "—"}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
