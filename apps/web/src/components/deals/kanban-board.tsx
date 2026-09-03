"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { KanbanColumn } from "./kanban-column"
import { DealCard } from "./deal-card"
import type { DealData, DealStageData } from "@/lib/api/types"

interface KanbanBoardProps {
  deals: DealData[]
  stages: DealStageData[]
  onMoveDeal: (dealId: string, toStageId: string) => void
}

export function KanbanBoard({ deals, stages, onMoveDeal }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Небольшое расстояние активации, чтобы клик по карточке (переход)
      // не превращался в перетаскивание.
      activationConstraint: { distance: 6 },
    })
  )

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) ?? null : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const dealId = active.id as string
    const toStageId = over.id as string
    if (dealId && toStageId) {
      onMoveDeal(dealId, toStageId)
    }
  }

  const dealsByStage = new Map<string, DealData[]>()
  stages.forEach((stage) => {
    dealsByStage.set(stage.id, [])
  })
  deals.forEach((deal) => {
    if (dealsByStage.has(deal.stageId)) {
      dealsByStage.get(deal.stageId)!.push(deal)
    }
  })

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-2">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            id={stage.id}
            title={stage.name}
            deals={dealsByStage.get(stage.id) || []}
            color={stage.color || undefined}
            probability={stage.probability}
            isWonStage={stage.isWonStage}
            isLostStage={stage.isLostStage}
          />
        ))}
      </div>

      {/* «Плавающая» карточка, следующая за мышью при перетаскивании. */}
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeDeal ? (
          <div className="rotate-2 cursor-grabbing">
            <DealCard deal={activeDeal} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
