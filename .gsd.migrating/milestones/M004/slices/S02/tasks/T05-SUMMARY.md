---
id: T05
parent: S02
milestone: M004
key_files:
  - apps/web/src/lib/api/projects.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T09:57:02.516Z
blocker_discovered: false
---

# T05: Created ProjectApiClient class with CRUD operations following DealApiClient pattern

**Created ProjectApiClient class with CRUD operations following DealApiClient pattern**

## What Happened

Created apps/web/src/lib/api/projects.ts with ProjectApiClient class. Implementation includes:
- url() helper for building URLs with query params
- getProjects() with ProjectListParams filtering (status, managerId, contactId, dealId, skip, take)
- getProject() for single resource fetch with ID validation
- createProject() for POST requests
- updateProject() for PATCH requests with ID validation
- deleteProject() for DELETE (soft-delete) with ID validation

Uses shared utilities (parseApiError, parseJson, ApiClientError) from shared.ts. Follows the exact pattern of DealApiClient with singleton export 'projectsApi' and convenience exports for all methods.

## Verification

File exists at apps/web/src/lib/api/projects.ts. TypeScript compilation shows no errors specific to this file (pre-existing errors are in other files). Implementation includes all required methods (getProjects, getProject, createProject, updateProject, deleteProject), uses shared utilities correctly, exports singleton and convenience exports.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f apps/web/src/lib/api/projects.ts` | 0 | PASS | 50ms |
| 2 | `npx tsc --noEmit 2>&1 | grep 'src/lib/api/projects.ts'` | 0 | PASS | 1200ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/api/projects.ts`
