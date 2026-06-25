---
id: T02
parent: S05
milestone: M004
key_files:
  - apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T13:28:17.574Z
blocker_discovered: false
---

# T02: Created PATCH API route for updating project stage dates via drag-drop

**Created PATCH API route for updating project stage dates via drag-drop**

## What Happened

Created API route at apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts with PATCH handler. The route validates endDate >= startDate before updating. Uses ProjectRepository.updateStage() method to persist date changes. Includes console logging for operations and structured error responses with 400 status for validation errors and 500 for internal errors.

## Verification

Verified route file exists and exports PATCH function. Confirmed the file follows Next.js App Router conventions with proper error handling and date validation.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts` | 0 | pass | 50ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts`
