---
id: T02
parent: S01
milestone: M009
key_files:
  - apps/web/src/app/api/deals/route.ts
  - apps/web/src/app/api/deals/[id]/route.ts
  - apps/web/src/app/api/deals/[id]/move/route.ts
key_decisions: []
duration: 
verification_result: untested
completed_at: 2026-06-21T09:28:20.794Z
blocker_discovered: false
---

# T02: API routes созданы: GET/POST /api/deals, GET/PATCH/DELETE /api/deals/[id], POST /api/deals/[id]/move

**API routes созданы: GET/POST /api/deals, GET/PATCH/DELETE /api/deals/[id], POST /api/deals/[id]/move**

## What Happened

Созданы API route handlers по аналогии с contacts:

1. apps/web/src/app/api/deals/route.ts: GET (list с фильтрами pipelineId, stageId, managerId, contactId, status), POST (create с валидацией title, pipelineId, stageId).

2. apps/web/src/app/api/deals/[id]/route.ts: GET (one with include stage/pipeline/contact/manager/history), PATCH (update полей, stage change через /move), DELETE (soft delete).

3. apps/web/src/app/api/deals/[id]/move/route.ts: POST для перемещения между этапами с изменённым by, comment, записью DealHistory через DealRepository.moveStage.

## Verification

Route handlers созданы по аналогии с contacts API. GET/PATCH/DELETE для single deal, POST /move для stage transitions.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/deals/route.ts`
- `apps/web/src/app/api/deals/[id]/route.ts`
- `apps/web/src/app/api/deals/[id]/move/route.ts`
