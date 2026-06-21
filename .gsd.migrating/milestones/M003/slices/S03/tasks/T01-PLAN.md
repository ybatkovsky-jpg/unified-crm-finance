---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Add DealHistory to API types

Extend the type system to support DealHistory data. The API already returns history in GET /api/deals/[id] response (S01 completed), but the client types don't include it yet. This task adds DealHistoryData type and extends DealData to include the history array.

## Inputs

- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/lib/api/types.ts`

## Verification

grep -q 'DealHistoryData' apps/web/src/lib/api/types.ts && grep -q 'history\?: DealHistoryData\[\]' apps/web/src/lib/api/types.ts

## Observability Impact

No runtime observability changes - type definitions only
