"use client"

import { useDroppable } from "@dnd-kit/core"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type DealData } from "@/lib/api/types"
import { DraggableDealCard } from "./deal-card-draggable"

interface KanbanColumnProps {
  id: string
  title: string
  deals: DealData[]
  color?: string
  probability?: number
  isWonStage?: boolean
  isLostStage?: boolean
}

export function KanbanColumn({
  id,
  title,
  deals,
  color,
  probability,
  isWonStage,
  isLostStage,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      stageId: id,
    },
  })

  const totalAmount = deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0)

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 min-w-80 transition-all duration-200 ${
        isOver ? "ring-2 ring-primary/50 bg-accent/30 rounded-lg" : ""
      }`}
    >
      <Card className="h-full">
        <CardHeader
          className="pb-3"
          style={{
            borderTopColor: color || undefined,
            borderTopWidth: "4px",
            borderTopStyle: "solid",
          }}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Badge
              variant={isWonStage ? "default" : isLostStage ? "destructive" : "secondary"}
              className="text-xs"
            >
              {deals.length}
            </Badge>
          </div>
          {probability !== undefined && probability > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Вероятность: {probability}%
            </p>
          )}
          {totalAmount > 0 && (
            <p className="text-xs text-muted-foreground">
              {totalAmount.toLocaleString("ru-RU")} RUB
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto">
            {deals.map((deal) => (
              <DraggableDealCard key={deal.id} deal={deal} />
            ))}
            {deals.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Нет сделок
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
