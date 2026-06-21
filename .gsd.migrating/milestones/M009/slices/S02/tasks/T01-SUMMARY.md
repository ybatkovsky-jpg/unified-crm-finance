---
id: T01
parent: S02
milestone: M009
key_files:
  - apps/web/src/components/deals/deal-card.tsx
  - apps/web/src/components/deals/deal-card-draggable.tsx
  - apps/web/src/components/deals/kanban-column.tsx
  - apps/web/src/components/deals/kanban-board.tsx
key_decisions: []
duration: 
verification_result: untested
completed_at: 2026-06-21T09:32:12.079Z
blocker_discovered: false
---

# T01: Компоненты Kanban board созданы с drag-and-drop через @dnd-kit

**Компоненты Kanban board созданы с drag-and-drop через @dnd-kit**

## What Happened

Созданы компоненты Kanban board: DealCard (карточка сделки с ссылкой на detail), DraggableDealCard (оборачивает DealCard для drag-and-drop через @dnd-kit/core), KanbanColumn (колонка этапа с droppable zone, счётчиком сделок, суммой amount, цветом этапа), KanbanBoard (DndContext, группировка сделок по stageId, обработка onDragEnd для перемещения).

## Verification

Компоненты созданы, используют @dnd-kit/core для drag-and-drop. KanbanColumn имеет droppable zone, DraggableDealCard draggable handle. onDragEnd вызывает onMoveDeal с dealId и toStageId.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/components/deals/deal-card.tsx`
- `apps/web/src/components/deals/deal-card-draggable.tsx`
- `apps/web/src/components/deals/kanban-column.tsx`
- `apps/web/src/components/deals/kanban-board.tsx`
