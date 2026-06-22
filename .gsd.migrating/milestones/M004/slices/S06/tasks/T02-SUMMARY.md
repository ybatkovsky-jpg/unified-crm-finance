---
id: T02
parent: S06
milestone: M004
key_files:
  - apps/web/src/app/api/productions/[id]/stages/route.ts
  - apps/web/src/app/api/stages/[id]/route.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T13:50:57.433Z
blocker_discovered: false
---

# T02: ProductionStage API endpoints created - GET/POST for production stages, PATCH/DELETE for individual stages

**ProductionStage API endpoints created - GET/POST for production stages, PATCH/DELETE for individual stages**

## What Happened

Created two ProductionStage API endpoint files:

1. **GET /api/productions/[id]/stages** - Lists all stages for a production ordered by sequence. Verifies production exists before returning results.

2. **POST /api/productions/[id]/stages** - Creates new stage with validation for required fields (name, order). Uses productionId from route parameter.

3. **GET /api/stages/[id]** - Fetches single production stage. Returns 404 if not found.

4. **PATCH /api/stages/[id]** - Updates allowed fields (name, order, dates, notes, status). Automatically sets completedAt when status becomes 'completed' if not already provided.

5. **DELETE /api/stages/[id]** - Hard deletes production stage (stages don't support soft-delete).

All endpoints follow the established API patterns:
- Use ProductionRepository stage methods (findStages, findStage, createStage, updateStage, deleteStage)
- Return NextResponse.json({ data: result }) for success
- Return { error, message } with appropriate status codes for failures
- Console logging for errors with structured error messages
- Verify resource existence before operations

TypeScript compilation verified with no stage-related errors.

## Verification

TypeScript compilation check passed with no stage-related errors. All endpoints follow the established API patterns with proper error handling, console logging, and NextResponse.json format.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit 2>&1 | grep -E 'stages|error TS'` | 0 | pass | 32000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/productions/[id]/stages/route.ts`
- `apps/web/src/app/api/stages/[id]/route.ts`
