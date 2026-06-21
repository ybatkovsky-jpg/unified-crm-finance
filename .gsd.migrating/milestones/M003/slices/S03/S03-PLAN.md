# S03: Deal Detail Page and History Timeline

**Goal:** Create a detailed page for deals at /deals/[id] that shows deal information and DealHistoryTimeline with stage transition history (fromStage→toStage with dates, comments, and user info).
**Demo:** Страница /deals/[id] показывает карточку сделки с контактом, этапом, суммой; DealHistoryTimeline показывает историю переходов fromStage→toStage с датами и комментариями

## Must-Haves

- Complete the planned slice outcomes.

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [x] **T01: Add DealHistory stage relations to API response** `est:15m`
  The GET /api/deals/[id] endpoint currently includes `history` but doesn't fetch the related DealStage records (fromStage, toStage) needed by DealHistoryTimeline. Update the Prisma include to fetch these relations.
  - Files: `apps/web/src/app/api/deals/[id]/route.ts`
  - Verify: cd apps/web && npx tsx --test src/lib/api/deals.test.ts 2>&1 | grep -E '(PASS|FAIL|passed|failed)'

- [x] **T02: Create DealHistoryTimeline component** `est:30m`
  Create the DealHistoryTimeline component at `apps/web/src/components/deals/deal-history-timeline.tsx` that displays stage transition history.
  - Files: `apps/web/src/components/deals/deal-history-timeline.tsx`
  - Verify: cd apps/web && npx tsc --noEmit 2>&1 | head -20

- [x] **T03: Integrate DealHistoryTimeline into deal detail page** `est:15m`
  Update the deal detail page at `apps/web/src/app/deals/[id]/page.tsx` to include the DealHistoryTimeline component.
  - Files: `apps/web/src/app/deals/[id]/page.tsx`
  - Verify: cd apps/web && npx tsc --noEmit 2>&1 | head -20

## Files Likely Touched

- apps/web/src/app/api/deals/[id]/route.ts
- apps/web/src/components/deals/deal-history-timeline.tsx
- apps/web/src/app/deals/[id]/page.tsx
