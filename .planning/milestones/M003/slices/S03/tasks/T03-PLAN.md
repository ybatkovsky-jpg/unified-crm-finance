---
estimated_steps: 8
estimated_files: 1
skills_used: []
---

# T03: Integrate DealHistoryTimeline into deal detail page

Update the deal detail page at `apps/web/src/app/deals/[id]/page.tsx` to include the DealHistoryTimeline component.

**Why:** The detail page already shows deal info but lacks the history timeline. Adding it completes the S03 deliverable.

**Do:**
- Import DealHistoryTimeline
- Add a new section after existing deal info
- Pass `deal.history` as prop
- Ensure proper styling matches existing UI

**Done when:** Navigating to /deals/[id] shows the history timeline below deal information.

## Inputs

- `apps/web/src/app/deals/[id]/page.tsx`
- `apps/web/src/components/deals/deal-history-timeline.tsx`

## Expected Output

- `apps/web/src/app/deals/[id]/page.tsx`

## Verification

cd apps/web && npx tsc --noEmit 2>&1 | head -20

## Observability Impact

Page-level loading/error states already exist. Timeline has its own states.
