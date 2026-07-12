"use client"

import { useDroppable } from "@dnd-kit/core"
import { Badge } from "@/components/ui/badge"
import { type DealData } from "@/lib/api/types"
import { DraggableDealCard } from "./deal-card-draggable"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle } from "lucide-react"

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
    data: { stageId: id },
  })

  const totalAmount = deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0)
  const accent = color || (isWonStage ? "#22c55e" : isLostStage ? "#ef4444" : "#6366f1")

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 min-w-72 h-full rounded-xl border bg-card/50 backdrop-blur-sm transition-all duration-200",
        isOver && "ring-2 ring-primary/60 bg-accent/40 scale-[1.01]"
      )}
    >
      {/* Column header */}
      <div className="shrink-0 px-3 py-2.5 border-b bg-muted/40 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: accent }}
          />
          {isWonStage && <CheckCircle2 className="size-3.5 text-green-600 shrink-0" />}
          {isLostStage && <XCircle className="size-3.5 text-red-600 shrink-0" />}
          <span className="text-sm font-semibold truncate">{title}</span>
          <Badge variant="secondary" className="ml-auto text-[10px] tabular-nums px-1.5">
            {deals.length}
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-1 px-4">
          {totalAmount > 0 ? (
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
              {totalAmount.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽
            </span>
          ) : (
            <span />
          )}
          {probability !== undefined && probability > 0 && (
            <span className="text-[10px] text-muted-foreground">{probability}%</span>
          )}
        </div>
      </div>

      {/* Scrollable card area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2 kanban-scroll">
        {deals.map((deal) => (
          <DraggableDealCard key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-xs text-muted-foreground/60">Пусто</span>
          </div>
        )}
      </div>
    </div>
  )
}
