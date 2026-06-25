---
id: T03
parent: S05
milestone: M004
key_files:
  - apps/web/src/lib/api/projects.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T13:29:28.467Z
blocker_discovered: false
---

# T03: Added updateStage method to ProjectApiClient for stage date updates

**Added updateStage method to ProjectApiClient for stage date updates**

## What Happened

Added updateStage method to ProjectApiClient in apps/web/src/lib/api/projects.ts. The method takes projectId, stageId, and ProjectStageUpdateInput parameters, calls PATCH /api/projects/[id]/stages/[stageId] with proper error handling via parseApiError, and returns ApiResponse<ProjectStageData>. Also added ProjectStageUpdateInput to imports and exported updateStage in convenience exports.

## Verification

Verified updateStage method exists in projects.ts by grep. Confirmed method is exported in convenience exports.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep updateStage apps/web/src/lib/api/projects.ts` | 0 | pass | 50ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/api/projects.ts`
