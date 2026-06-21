---
id: T02
parent: S02
milestone: M003
key_files:
  - apps/web/src/app/api/deals/[id]/move/route.ts
  - apps/web/src/components/deals/kanban-column.tsx
  - apps/web/src/app/deals/page.tsx
key_decisions:
  - Prisma include uses schema field names (DealStage/Pipeline/Contact/User), not the camelCase aliases used in API types (stage/pipeline/contact/manager) — field mapping happens at the API route boundary
  - Move relation fetching to the API route rather than the DealRepository to keep repository methods simple (single responsibility) and to contain Prisma naming conventions at the API boundary
duration: 
verification_result: passed
completed_at: 2026-06-21T14:50:54.636Z
blocker_discovered: false
---

# T02: Fixed moveDeal to return full relations, expanded KanbanColumn drop target to full column with drag-over highlight, and replaced alert() with server refetch on move errors

**Fixed moveDeal to return full relations, expanded KanbanColumn drop target to full column with drag-over highlight, and replaced alert() with server refetch on move errors**

## What Happened

Fixed three drag-and-drop bugs in the deals kanban board:

1. **moveDeal missing relations**: The moveDeal API endpoint now fetches the full deal with DealStage/Pipeline/Contact/User relations after calling moveStage(), and maps Prisma PascalCase field names to the API camelCase shape (DealStage→stage, Pipeline→pipeline, Contact→contact, User→manager). This ensures the DealCard displays correct stage name, contact, and manager after a drag-and-drop move.

2. **Drop target limited to CardHeader**: Moved `setNodeRef` from the `<CardHeader>` element to the outer column `<div>`, making the entire column (including card area) a valid drop target. Previously drops on the card content area were silently ignored.

3. **No drag-over feedback**: Destructured `isOver` from `useDroppable` and applied conditional CSS classes (`ring-2 ring-primary/50 bg-accent/30 rounded-lg` with `transition-all duration-200`) to the outer column div, giving clear visual feedback when a deal card is dragged over it.

4. **Error handling**: Replaced `alert()` with `fetchDeals(statusFilter)` on move failure, ensuring the UI refetches correct server state instead of showing a blocking dialog. Also removed the manual `stageId: toStageId` override in the optimistic update since the API now returns the correct stageId in the full deal response.

## Verification

Ran the deal repository test suite: `cd apps/web && npx tsx --test src/lib/db/deals.test.ts` — all 34 tests passed (34 pass, 0 fail). Verified the moveDeal API route correctly maps Prisma field names to API shape. Verified KanbanColumn component structure: setNodeRef is on outer div with isOver-based highlight classes. Verified page.tsx handleMoveDeal uses fetchDeals(statusFilter) on error instead of alert().

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd apps/web && npx tsx --test src/lib/db/deals.test.ts` | 0 | pass | 907ms |

## Deviations

Task plan specified `include: { stage: true, pipeline: true, contact: true, manager: true }` in DealRepository.moveStage(), but Prisma schema uses PascalCase relation field names (DealStage, Pipeline, Contact, User). Instead of modifying the repository, added a separate prisma.deal.findUnique() call with correct include in the moveDeal API route, with explicit Prisma→API field name mapping. This avoids leaking Prisma naming conventions into the repository layer.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/deals/[id]/move/route.ts`
- `apps/web/src/components/deals/kanban-column.tsx`
- `apps/web/src/app/deals/page.tsx`
