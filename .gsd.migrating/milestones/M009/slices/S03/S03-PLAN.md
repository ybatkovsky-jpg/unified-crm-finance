# S03: Deal Detail Page

**Goal:** Create detailed page at /deals/[id] with deal history timeline (DealHistory), showing stage changes with from/to, comment, who changed, and when
**Demo:** Детальная страница сделки с историей (DealHistory), связанными контактами, задачами, событиями.

## Must-Haves

- Complete the planned slice outcomes.

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [ ] **T01: Add DealHistory to API types** `est:15m`
  Extend the type system to support DealHistory data. The API already returns history in GET /api/deals/[id] response (S01 completed), but the client types don't include it yet. This task adds DealHistoryData type and extends DealData to include the history array.
  - Files: `apps/web/src/lib/api/types.ts`
  - Verify: grep -q 'DealHistoryData' apps/web/src/lib/api/types.ts && grep -q 'history\?: DealHistoryData\[\]' apps/web/src/lib/api/types.ts

- [ ] **T02: Create DealHistoryTimeline component** `est:45m`
  Build a timeline component to display deal history (stage changes). Follows the InteractionTimeline pattern from M002. Shows fromStage, toStage, comment, changedBy, and changedAt for each DealHistory entry. Uses lucide-react icons (History, ArrowRight) and shadcn/ui Card/Badge components. Handles loading, error, and empty states.
  - Files: `apps/web/src/components/deals/deal-history-timeline.tsx`
  - Verify: test -f apps/web/src/components/deals/deal-history-timeline.tsx && grep -q 'export.*DealHistoryTimeline' apps/web/src/components/deals/deal-history-timeline.tsx && grep -q 'fromStage\|toStage\|changedBy\|changedAt' apps/web/src/components/deals/deal-history-timeline.tsx

- [ ] **T03: Integrate DealHistoryTimeline into deal detail page** `est:30m`
  Add the history timeline section to the existing deal detail page. Import DealHistoryTimeline component and render it after the Related card in the main content column. Pass deal.history as prop to the timeline component. Ensure consistent styling with existing UI.
  - Files: `apps/web/src/app/deals/[id]/page.tsx`
  - Verify: grep -q 'DealHistoryTimeline' apps/web/src/app/deals/[id]/page.tsx && grep -q '<DealHistoryTimeline' apps/web/src/app/deals/[id]/page.tsx

- [ ] **T04: Verify deal detail page with history** `est:15m`
  Verify that the deal detail page displays history correctly. Check that the component imports exist, the timeline renders history array data, and existing deal detail functionality remains intact. Run TypeScript compilation to ensure no type errors.
  - Files: `apps/web/src/app/deals/[id]/page.tsx`, `apps/web/src/components/deals/deal-history-timeline.tsx`, `apps/web/src/lib/api/types.ts`
  - Verify: cd apps/web && npx tsc --noEmit 2>&1 | grep -v 'node_modules' || true

## Files Likely Touched

- apps/web/src/lib/api/types.ts
- apps/web/src/components/deals/deal-history-timeline.tsx
- apps/web/src/app/deals/[id]/page.tsx
