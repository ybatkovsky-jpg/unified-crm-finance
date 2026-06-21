---
estimated_steps: 8
estimated_files: 3
skills_used: []
---

# T02: Fix moveDeal relations, KanbanColumn drop target, and drag-over feedback

Why: Three bugs break drag-and-drop: (1) moveStage returns deal without relations, so after a move the card loses stage name/contact/manager display; (2) drop target is only on CardHeader, not full column, making drops on the card area miss; (3) no visual feedback when dragging over a column.

Do:
1. In DealRepository.moveStage() (apps/web/src/lib/db/deals.ts line 192-198), add include to the prisma.deal.update() call: include: { stage: true, pipeline: true, contact: true, manager: true }. This ensures the returned deal has all relation data.
2. In KanbanColumn (apps/web/src/components/deals/kanban-column.tsx), destructure isOver from useDroppable and move setNodeRef from CardHeader (line 42) to the outer div (line 38) so the entire column is a drop target.
3. Apply visual feedback: when isOver is true, add className "ring-2 ring-primary/50 bg-accent/30" to the outer div. Also add smooth transition: "transition-all duration-200".
4. In page.tsx handleMoveDeal (line 64-86), replace alert() with refetch logic: on error, call fetchDeals(statusFilter) to restore correct state from server. Remove the manual stageId override on line 76 (stageId: toStageId) since the API now returns full deal with correct stageId from include.
5. Run existing deal repository tests: cd apps/web && npx tsx --test src/lib/db/deals.test.ts (34 tests must still pass).

Done when: After drag-and-drop, DealCard shows correct stage name/contact/manager; entire column accepts drops; columns highlight on drag-over; failed move triggers refetch instead of alert.

## Inputs

- `apps/web/src/lib/db/deals.ts`
- `apps/web/src/components/deals/kanban-column.tsx`
- `apps/web/src/components/deals/kanban-board.tsx`
- `apps/web/src/app/deals/page.tsx`
- `apps/web/src/lib/db/deals.test.ts`

## Expected Output

- `apps/web/src/lib/db/deals.ts`
- `apps/web/src/components/deals/kanban-column.tsx`
- `apps/web/src/app/deals/page.tsx`

## Verification

cd apps/web && npx tsx --test src/lib/db/deals.test.ts
