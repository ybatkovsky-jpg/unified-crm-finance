"use client"

import { useDraggable } from "@dnd-kit/core"
import { DealCard } from "./deal-card"
import type { DealData } from "@/lib/api/types"

interface DraggableDealCardProps {
  deal: DealData
}

export function DraggableDealCard({ deal }: DraggableDealCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: {
      dealId: deal.id,
      stageId: deal.stageId,
    },
  })

  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <DealCard deal={deal} isDragging={isDragging} />
    </div>
  )
}
