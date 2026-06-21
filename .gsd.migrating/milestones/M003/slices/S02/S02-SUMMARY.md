---
id: S02
parent: M009
milestone: M009
provides:
  - []
requires:
  []
affects:
  []
key_files:
  - ["apps/web/src/app/deals/page.tsx", "apps/web/src/app/deals/[id]/page.tsx", "apps/web/src/components/deals/*.tsx", "apps/web/src/lib/api/deals.ts", "apps/web/src/lib/api/types.ts"]
key_decisions:
  - ["Использовать @dnd-kit для drag-and-drop (стандарт для React)", "Kanban колонки с droppable zones, карточки draggable", "Страница list + detail паттерн по аналогии с contacts"]
patterns_established:
  - ["@dnd-kit/core для drag-and-drop", "API client pattern с fetch wrapper", "List + detail page structure", "Modal для create действий"]
observability_surfaces:
  - ["console.error для API errors", "Loading states", "Error boundaries с Card", "ApiClientError для typed errors"]
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-06-21T09:32:35.065Z
blocker_discovered: false
---

# S02: Deals UI

**UI для воронки сделок: Kanban board, drag-and-drop, filters, create modal, detail page**

## What Happened

Создан UI для работы с воронкой сделок: Kanban board с drag-and-drop, фильтры, Create модал, detail page.

Компоненты: DealCard (отображение сделки со ссылкой), DraggableDealCard (drag handle), KanbanColumn (этап воронки с droppable zone, счётчиком, суммой, цветом), KanbanBoard (DndContext, группировка сделок, onDragEnd), FilterBar (статус фильтр, refresh), CreateDealModal (формы создания).

/deals page: fetch dealsApi.getDeals, extractStagesFromDeals, KanbanBoard с onMoveDeal (вызывает moveDeal API, обновляет state).

/deals/[id] page: fetch dealsApi.getDeal, details секция (просмотр/edit), related секции (контакт, менеджер), stage info card, metadata card.

API клиент: dealsApi с методами getDeals, getDeal, createDeal, updateDeal, deleteDeal, moveDeal. Types: DealData, DealStageData, DealCreateInput, DealUpdateInput, DealMoveInput.

## Verification

Компоненты созданы, интегрированы в /deals page. Drag-and-drop через @dnd-kit/core. API client работает. Detail page с edit mode.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

None.
