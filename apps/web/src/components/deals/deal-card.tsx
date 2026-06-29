"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, DollarSign, User } from "lucide-react"
import Link from "next/link"
import type { DealData } from "@/lib/api/types"
import { getDeadlineInfo, formatDeadlineLabel, cn } from "@/lib/utils"

interface DealCardProps {
  deal: DealData
  isDragging?: boolean
}

/** Tailwind classes per deadline urgency level. */
const DEADLINE_STYLES: Record<string, string> = {
  overdue: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  soon: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  upcoming: "bg-muted text-muted-foreground",
}

export function DealCard({ deal, isDragging }: DealCardProps) {
  const deadline = getDeadlineInfo(deal.expectedCloseDate)
  // CRM-03: project deadline takes priority over deal expectedCloseDate
  const projectDeadline = deal.project?.endDate ? getDeadlineInfo(deal.project.endDate) : null
  return (
    <Link href={`/deals/${deal.id}`}>
      <Card
        className={`cursor-pointer transition-shadow hover:shadow-md ${
          isDragging ? "opacity-50" : ""
        }`}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {deal.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{deal.number}</span>
            {deal.source && (
              <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                {deal.source.name}
              </Badge>
            )}
          </div>

          {Number(deal.amount) > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <DollarSign className="size-3 text-muted-foreground" />
              <span className="font-medium">
                {Number(deal.amount).toLocaleString("ru-RU")} {deal.currency}
              </span>
            </div>
          )}

          {deal.contact && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="size-3" />
              <span className="line-clamp-1">
                {deal.contact.type === 'company'
                  ? deal.contact.companyName || '\—'
                  : [deal.contact.firstName, deal.contact.lastName].filter(Boolean).join(' ') || '\—'}
              </span>
            </div>
          )}

          {projectDeadline ? (
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 min-w-0">
                <CalendarDays className="size-3 shrink-0" />
                <span className="truncate">
                  {new Date(deal.project!.endDate!).toLocaleDateString("ru-RU")} · проект {deal.project!.externalNumber}
                </span>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "shrink-0 text-[10px] font-medium",
                  DEADLINE_STYLES[projectDeadline.level]
                )}
              >
                {formatDeadlineLabel(projectDeadline)}
              </Badge>
            </div>
          ) : deal.expectedCloseDate && (
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 min-w-0">
                <CalendarDays className="size-3 shrink-0" />
                <span className="truncate">
                  {new Date(deal.expectedCloseDate).toLocaleDateString("ru-RU")}
                </span>
              </div>
              {deadline && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "shrink-0 text-[10px] font-medium",
                    DEADLINE_STYLES[deadline.level]
                  )}
                >
                  {formatDeadlineLabel(deadline)}
                </Badge>
              )}
            </div>
          )}

          {deal.manager && (
            <Badge variant="outline" className="text-xs w-fit">
              {deal.manager.name || deal.manager.email || '\—'}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
