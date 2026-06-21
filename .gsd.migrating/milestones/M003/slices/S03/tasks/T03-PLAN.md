---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T03: Integrate DealHistoryTimeline into deal detail page

Add the history timeline section to the existing deal detail page. Import DealHistoryTimeline component and render it after the Related card in the main content column. Pass deal.history as prop to the timeline component. Ensure consistent styling with existing UI.

## Inputs

- `apps/web/src/app/deals/[id]/page.tsx`
- `apps/web/src/components/deals/deal-history-timeline.tsx`
- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/app/deals/[id]/page.tsx`

## Verification

grep -q 'DealHistoryTimeline' apps/web/src/app/deals/[id]/page.tsx && grep -q '<DealHistoryTimeline' apps/web/src/app/deals/[id]/page.tsx

## Observability Impact

No new observability - uses existing deal data fetch error handling
