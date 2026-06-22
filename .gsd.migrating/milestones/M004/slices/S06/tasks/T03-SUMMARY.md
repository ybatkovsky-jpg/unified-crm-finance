---
id: T03
parent: S06
milestone: M004
key_files:
  - apps/web/src/lib/api/types.ts
  - apps/web/src/lib/api/productions.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T13:52:40.596Z
blocker_discovered: false
---

# T03: Production API client and types created - ProductionApiClient with 11 methods matching API routes

**Production API client and types created - ProductionApiClient with 11 methods matching API routes**

## What Happened

Added Production and ProductionStage types to apps/web/src/lib/api/types.ts:
- ProductionData, ProductionStageData (with relations)
- ProductionCreateInput, ProductionUpdateInput
- ProductionStageCreateInput, ProductionStageUpdateInput, ProductionStageMoveInput
- ProductionFilters, ProductionListParams

Created apps/web/src/lib/api/productions.ts with ProductionApiClient class following ProjectApiClient pattern:
- getProductions(projectId) - list productions for project
- getProduction(id) - fetch single with stages
- createProduction(projectId, data) - create production
- updateProduction(id, data) - update production
- deleteProduction(id) - soft delete
- getStages(productionId) - list stages
- createStage(productionId, data) - create stage
- updateStage(id, data) - update stage
- deleteStage(id) - delete stage
- moveStage(id, data) - move stage status

All methods use ApiClientError for validation errors and parseApiError for API errors. Default singleton instance exported with convenience method exports.

TypeScript compilation verified with no production-related errors.

## Verification

TypeScript compilation check passed with no production-related errors. All types match the Prisma schema (Production and ProductionStage models). API client follows the established pattern from ProjectApiClient.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit 2>&1 | grep -E 'productions|error TS'` | 0 | pass | 31000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/api/productions.ts`
