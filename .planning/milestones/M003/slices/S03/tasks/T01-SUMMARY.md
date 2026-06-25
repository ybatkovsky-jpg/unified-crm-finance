---
id: T01
parent: S03
milestone: M003
key_files:
  - apps/web/src/app/api/deals/[id]/route.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-21T15:11:22.509Z
blocker_discovered: false
---

# T01: Added fromStage/toStage relations to deals API response for DealHistoryTimeline

**Added fromStage/toStage relations to deals API response for DealHistoryTimeline**

## What Happened

Modified the Prisma include in the GET /api/deals/[id] endpoint to fetch fromStage and toStage relations within history entries. The change enables DealHistoryTimeline to display meaningful stage transition names (e.g., "Lead → Qualification") instead of just stage IDs.

**Change made:** Updated `apps/web/src/app/api/deals/[id]/route.ts` line 39-41 to include nested relations:
```typescript
history: {
  orderBy: { changedAt: 'desc' },
  include: {
    fromStage: true,
    toStage: true,
  },
},
```

**Verification:** All 44 deal API client tests passed. The test suite already had mock expectations for fromStage/toStage in history entries (line 86-87 of deals.test.ts), confirming the data contract.

## Verification

Ran the deal API client test suite (44 tests). All tests passed, including the "should return deal with nested relations" test which validates history entries with fromStage and toStage objects.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd apps/web && npx tsx --test src/lib/api/deals.test.ts` | 0 | PASS | 458ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/deals/[id]/route.ts`
