---
id: T07
parent: S07
milestone: M004
key_files:
  - apps/web/src/lib/db/projects.ts
  - apps/web/src/lib/db/projects.test.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T22:35:11.515Z
blocker_discovered: false
---

# T07: Added completeWithCascade method to ProjectRepository for cascading project completion to linked deals

**Added completeWithCascade method to ProjectRepository for cascading project completion to linked deals**

## What Happened

Added completeWithCascade(projectId: string, userId: string) method to ProjectRepository in apps/web/src/lib/db/projects.ts. The method:

1. Validates all project stages are completed before proceeding
2. Uses Prisma transaction to atomically update both Project and Deal
3. Sets Project.status='completed' and completedAt=now()
4. If project has a linked deal (via dealId), finds the won stage in the deal's pipeline
5. Moves the Deal to the won stage and sets closedAt=now() and actualCloseDate=now()
6. Creates DealHistory entry for the stage transition

Added Deal type import to projects.ts to support the return type.

Added 4 comprehensive tests to projects.test.ts:
- Test completing project with deal cascade (all stages completed)
- Test rejection when stages are incomplete
- Test completing project without linked deal
- Test error for non-existent project

All 38 tests pass successfully.

## Verification

Executed verification with grep -q 'completeWithCascade' apps/web/src/lib/db/projects.ts - confirmed method exists. Ran full test suite with npx tsx apps/web/src/lib/db/projects.test.ts - all 38 tests pass including 4 new completeWithCascade tests.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q 'completeWithCascade' apps/web/src/lib/db/projects.ts` | 0 | pass | 150ms |
| 2 | `npx tsx apps/web/src/lib/db/projects.test.ts` | 0 | pass | 651966ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/db/projects.ts`
- `apps/web/src/lib/db/projects.test.ts`
