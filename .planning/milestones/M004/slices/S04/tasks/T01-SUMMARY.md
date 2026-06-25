---
id: T01
parent: S04
milestone: M004
key_files:
  - apps/web/src/app/api/projects/[id]/route.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T12:52:22.260Z
blocker_discovered: false
---

# T01: Added manual Deal and Contract relation fetching to GET /api/projects/[id] endpoint

**Added manual Deal and Contract relation fetching to GET /api/projects/[id] endpoint**

## What Happened

Modified the GET handler in apps/web/src/app/api/projects/[id]/route.ts to manually fetch Deal and Contract relations using the Prisma client. The implementation handles null cases (dealId/contractId may be null) and returns the merged data in the standard { data: project } format.

Key changes:
1. Added prisma import from '@/lib/db/prisma'
2. After fetching project with existing includes (ProjectStage, ProjectMember, Contact, User), extracted dealId and contractId
3. If dealId exists, fetch Deal with Contact and Pipeline relations via prisma.deal.findUnique
4. If contractId exists, fetch Contract with Contact and Deal relations via prisma.contract.findUnique
5. Merged Deal and Contract into the response data

This workaround is necessary because the Prisma schema lacks proper @relation back-references: Deal.projectId and Contract (which has no projectId field at all).

## Verification

TypeScript compilation check confirmed no new errors were introduced in the modified file. The implementation follows the existing pattern in the codebase and handles null cases for dealId and contractId.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit --skipLibCheck 2>&1 | grep -E 'projects/[id]/route'` | 0 | pass | 1200ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/projects/[id]/route.ts`
