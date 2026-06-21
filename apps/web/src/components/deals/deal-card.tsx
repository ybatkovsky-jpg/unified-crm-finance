"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, DollarSign, User } from "lucide-react"
import Link from "next/link"
import type { DealData } from "@/lib/api/types"

interface DealCardProps {
  deal: DealData
  isDragging?: boolean
}

export function DealCard({ deal, isDragging }: DealCardProps) {
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
          </div>

          {deal.amount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <DollarSign className="size-3 text-muted-foreground" />
              <span className="font-medium">
                {deal.amount.toLocaleString("ru-RU")} {deal.currency}
              </span>
            </div>
          )}

          {deal.contact && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="size-3" />
              <span className="line-clamp-1">
                {deal.contact.type === 'company'
                  ? deal.contact.companyName || '\u2014'
                  : [deal.contact.firstName, deal.contact.lastName].filter(Boolean).join(' ') || '\u2014'}
              </span>
            </div>
          )}

          {deal.expectedCloseDate && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              <span>
                {new Date(deal.expectedCloseDate).toLocaleDateString("ru-RU")}
              </span>
            </div>
          )}

          {deal.manager && (
            <Badge variant="outline" className="text-xs w-fit">
              {deal.manager.name || deal.manager.email || '\u2014'}
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
