---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T02: Create DealHistoryTimeline component

Build a timeline component to display deal history (stage changes). Follows the InteractionTimeline pattern from M002. Shows fromStage, toStage, comment, changedBy, and changedAt for each DealHistory entry. Uses lucide-react icons (History, ArrowRight) and shadcn/ui Card/Badge components. Handles loading, error, and empty states.

## Inputs

- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/components/deals/deal-history-timeline.tsx`

## Verification

test -f apps/web/src/components/deals/deal-history-timeline.tsx && grep -q 'export.*DealHistoryTimeline' apps/web/src/components/deals/deal-history-timeline.tsx && grep -q 'fromStage\|toStage\|changedBy\|changedAt' apps/web/src/components/deals/deal-history-timeline.tsx

## Observability Impact

Component renders error state for failed data fetch; empty state when no history exists
