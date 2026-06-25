# S02 Research: Kanban Board UI

**Slice:** S02 - Kanban Board UI  
**Milestone:** M003 - Сделки и контракты  
**Dependency:** S01 (Deal Repository & API) -- COMPLETE  
**Date:** 2026-06-22

---

## Summary

The Kanban Board UI for deals is largely scaffolded but has several structural gaps that must be resolved before drag-and-drop works correctly in production. All component files exist on disk and the data layer (S01) is complete. The main risks are: (1) empty pipeline stages are not rendered, (2) the move API response drops relation fields, and (3) the create-deal modal has no contact selector.

---

## Files and Their Roles

### UI Components (all at `apps/web/src/components/deals/`)

| File | Lines | Role |
|---|---|---|
| `kanban-board.tsx` | 65 | Orchestrator: DndContext with PointerSensor (8px activation distance), groups deals by stage into KanbanColumn children |
| `kanban-column.tsx` | 84 | Droppable zone via `useDroppable`. Displays stage header with deal count, probability, total amount in RUB. Cards scroll in `max-h-[calc(100vh-320px)]` |
| `deal-card.tsx` | 66 | Presentation card: shows title, auto-number, amount+currency, contact name, expected close date, manager badge. Links to `/deals/[id]` |
| `deal-card-draggable.tsx` | 25 | Thin wrapper: `useDraggable` hook attached to a `<div>` that wraps DealCard. Passes `isDragging` for opacity effect |
| `create-deal-modal.tsx` | 186 | Dialog with title (required), amount, currency (RUB/USD/EUR), expected close date, description. **Missing contact selector.** |
| `filter-bar.tsx` | 58 | Select dropdown (All/Open/Closed) + refresh button with spinner |

### Page

`apps/web/src/app/deals/page.tsx` (160 lines) -- orchestrates everything:
- Fetches deals via `dealsApi.getDeals()` with optional status filter
- Extracts stages **from deals only** via `extractStagesFromDeals()` 
- Renders KanbanBoard, CreateDealModal, FilterBar
- Handles loading/error/empty states

### API Client

`apps/web/src/lib/api/deals.ts` (224 lines) -- DealApiClient class:
- `getDeals(params?)` -> GET /api/deals
- `getDeal(id)` -> GET /api/deals/[id]
- `createDeal(data)` -> POST /api/deals
- `updateDeal(id, data)` -> PATCH /api/deals/[id]
- `deleteDeal(id)` -> DELETE /api/deals/[id]
- `moveDeal(id, data)` -> POST /api/deals/[id]/move
- Default singleton exported as `dealsApi`

### DB Repository

`apps/web/src/lib/db/deals.ts` (262 lines) -- DealRepository class:
- `findMany`, `findUnique`, `findByPipeline`, `findByStage`, `findByManager`, `findByContact`
- `create` (auto-generates `С-YYYY-NNNNN` number)
- `update`, `softDelete` (sets `deletedAt`)
- `moveStage` (records DealHistory entry, updates stage, sets `closedAt`/`actualCloseDate` if won/lost)
- `count`, `getHistory`

### API Routes

| Route | File | Methods |
|---|---|---|
| `/api/deals` | `route.ts` | GET (list with filters), POST (create) |
| `/api/deals/[id]` | `[id]/route.ts` | GET, PATCH (blocks stageId change -- redirects to /move), DELETE (soft) |
| `/api/deals/[id]/move` | `[id]/move/route.ts` | POST: validates stageId/changedBy, checks not in same stage, calls `moveStage` |
| `/api/deals/[id]/convert` | `[id]/convert/route.ts` | POST: creates Contract from Deal (S04 dependency) |

### Types

`apps/web/src/lib/api/types.ts` -- shared types including `DealData`, `DealStageData`, `PipelineData`, `DealCreateInput`, `DealMoveInput`, `DealListParams`, etc.

### Seed

`apps/web/prisma/seed-deals.ts` -- creates a default pipeline with ID `default-pipeline-id` and 8 stages (new, qualified, meeting, proposal, negotiation, contract, won, lost).

### Tests

No test files exist for deals. Reference patterns:
- `apps/web/src/lib/api/contacts.test.ts`  
- `apps/web/src/lib/db/contacts.test.ts`

---

## Dependencies

- `@dnd-kit/core@^6.3.1` -- drag-and-drop (core + PointerSensor)
- `@dnd-kit/utilities@^3.2.2` -- utility helpers
- `@dnd-kit/sortable@^10.0.0` -- installed but **not used** in current code (kanban uses plain DndContext, not SortableContext)
- shadcn/ui components: Card, Badge, Dialog, Button, Input, Select, Textarea, Label

---

## Critical Issues

### 1. Empty stages not rendered (BLOCKER)

`extractStagesFromDeals()` in `page.tsx` iterates over returned deals and pulls unique stages. **Stages without deals are invisible.** No pipeline/stage endpoint exists (`/api/pipelines` returns 404). This means:

- When no deals exist, the board shows "No pipeline stages found" even though stages are seeded
- Empty columns (stages between deals that have no cards) disappear entirely
- A new user sees an empty board and cannot create a deal because `firstStageId` will be empty

**Required fix:** Either:
  - (A) Add GET /api/pipelines/[id] or /api/pipelines endpoint that returns pipeline with stages
  - (B) Include pipeline stages alongside deals in the GET /api/deals response
  - (C) Create a standalone pipeline API client/endpoint

The page should fetch stages from the API, then fetch deals separately, rather than deriving stages from deals.

### 2. moveDeal API response drops relations (BUG)

The move endpoint (`[id]/move/route.ts`) calls `deals.moveStage()` which uses `prisma.deal.update()` **without `include`**. The returned object is a raw `Prisma.Deal` -- no `stage`, `pipeline`, `contact`, `manager` relations.

In `page.tsx` line 74-78:
```tsx
setDeals((prev) =>
  prev.map((deal) =>
    deal.id === dealId ? { ...response.data, stageId: toStageId } : deal
  )
)
```

`{ ...response.data }` spreads the raw Deal (which has no relation properties). This **overwrites** `deal.stage`, `deal.contact`, `deal.manager` with `undefined`. The kanban display will show a card with missing stage/contact/manager info after every drag-and-drop move.

**Required fix:** Add `include: { stage: true, pipeline: true, contact: true, manager: true }` to the `prisma.deal.update` call in `moveStage()`, or to the API route's response.

### 3. Missing contact selector in CreateDealModal (GAP)

The modal creates a deal with `title`, `amount`, `currency`, `expectedCloseDate`, `description` but **has no way to link a contact**. The API accepts `contactId` (optional), so a deal can be created without a contact, but for CRM purposes most deals should be linked.

**Required fix:** Add a contact search/select field using the contacts API.

### 4. Hardcoded values (DIRT)

- `page.tsx` line 94: `pipelineId = "default-pipeline-id"` -- must match seed. Fragile.
- `page.tsx` line 70: `changedBy: "current-user-id"` -- placeholder until auth session integration

### 5. Drop target is CardHeader, not full column (UX)

In `kanban-column.tsx`, `useDroppable`'s `setNodeRef` is placed on CardHeader (line 42), not on the outer div or CardContent. This means:
- Dropping on the CardContent area (the grey body where cards actually are) may not register
- Empty columns have only a small header drop zone

**Required fix:** Move `setNodeRef` to the outer `<div>` (line 38) so the entire column is a drop target.

### 6. No drag-over visual feedback (UX)

`@dnd-kit/core` supports `useDroppable({...}).isOver` but `KanbanColumn` does not use it. Cards being dragged over a column get no visual indication that dropping there is valid.

**Required fix:** Use `isOver` from `useDroppable` to apply a highlighted border/background on the drop target column.

### 7. No optimistic update rollback (RESILIENCE)

`handleMoveDeal` (line 64-86) performs an in-place state update after move but on error only calls `alert()`. The state is already mutated. If the server returns an error, the card will appear in the wrong column until the next full fetch.

**Required fix:** Either revert the state change on error, or refetch deals on error.

---

## What Works Well

- **Clean component decomposition** -- KanbanBoard, KanbanColumn, DealCard, DraggableDealCard, CreateDealModal, FilterBar all have single responsibilities
- **Three-state pattern** -- loading spinner, error with retry, empty state all handled per MEM034
- **Proper dnd-kit setup** -- PointerSensor with 8px activation distance prevents accidental drags
- **Typed API client** -- DealApiClient with full TypeScript coverage for all endpoints
- **Repository method isolation** -- moveStage handles both history recording and stage update atomically
- **Stage metadata display** -- columns show deal count badge, probability percentage, and total amount

---

## Existing Test Patterns

No tests exist for deals. However, the contacts module provides excellent reference patterns:

- `apps/web/src/lib/db/contacts.test.ts` -- tests the Prisma repository class
- `apps/web/src/lib/api/contacts.test.ts` -- tests the fetch-based API client

These use a mock/vitest pattern and should be replicated for deal components.

---

## Natural Task Seams

Recommended decomposition order (highest risk first):

1. **Pipeline/stage provisioning** -- Create pipeline API endpoint or include stages in GET /api/deals response. Fixes empty columns.
2. **Fix moveDeal response** -- Add include relations to the move API response. Fixes post-move data corruption.
3. **Add contact selector** -- Contact autocomplete in CreateDealModal (depends on contacts API from M002).
4. **KanbanColumn UX** -- Move drop target to full column, add drag-over highlighting, add optimistic rollback.
5. **Resolve hardcoded values** -- Pipeline ID from API, changedBy from auth.
6. **Add tests** -- API client tests + DB repository tests following contacts test patterns.
7. **E2E verification** -- Full flow: create deal -> see on kanban -> drag to another stage -> verify history.

---

## First Proof

The highest-risk item is **pipeline/stage provisioning** (issue #1). Without stages, the kanban board is unusable. This should be the first task.

The second-highest-risk item is **fixing the moveDeal response** (issue #2). Currently every drag-and-drop move corrupts the deal's relation data in the UI.

Both of these have a shared mitigation: they can be verified by running the page and checking that:
- The kanban shows all 8 stages even when no deals exist
- Dragging a card between columns does not lose the card's stage name, contact name, or manager name
