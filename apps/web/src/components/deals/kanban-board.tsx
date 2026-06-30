"use client"

import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { KanbanColumn } from "./kanban-column"
import type { DealData, DealStageData } from "@/lib/api/types"

interface KanbanBoardProps {
  deals: DealData[]
  stages: DealStageData[]
  onMoveDeal: (dealId: string, toStageId: string) => void
}

export function KanbanBoard({ deals, stages, onMoveDeal }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
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
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
    </DndContext>
  )
}
