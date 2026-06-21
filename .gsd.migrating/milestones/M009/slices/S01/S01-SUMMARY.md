---
id: S01
parent: M009
milestone: M009
provides:
  - []
requires:
  []
affects:
  []
key_files:
  - ["apps/web/src/lib/db/deals.ts", "apps/web/src/app/api/deals/route.ts", "apps/web/src/app/api/deals/[id]/route.ts", "apps/web/src/app/api/deals/[id]/move/route.ts", "apps/web/prisma/seed-deals.ts"]
key_decisions:
  - ["Использовать паттерн Repository по аналогии с contacts", "Автонумерация формата С-YYYY-NNNNN для единообразия", "moveStage в отдельном endpoint для явного действия и истории"]
patterns_established:
  - ["Repository класс с singleton export", "API routes с GET/PATCH/DELETE для CRUD", "POST /move для stage transitions с DealHistory"]
observability_surfaces:
  - ["console.error во всех API handlers", "DealHistory запись для stage transitions", "Where фильтры исключают deletedAt"]
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-06-21T09:28:33.162Z
blocker_discovered: false
---

# S01: Deal API

**CRUD API для сделок с репозиторием, route handlers и seed данными для Pipeline/DealStage**

## What Happened

Создан DealRepository (apps/web/src/lib/db/deals.ts) с методами findMany, findUnique, findBy*, create, update, moveStage, softDelete, count, getHistory. moveStage записывает DealHistory. Автонумерация С-YYYY-NNNNN.

API endpoints: GET/POST /api/deals, GET/PATCH/DELETE /api/deals/[id], POST /api/deals/[id]/move. Фильтры по pipelineId, stageId, managerId, contactId, status.

Seed скрипт создал default pipeline с 8 стадиями: new(10%), qualified(30%), meeting(50%), proposal(60%), negotiation(70%), contract(90%), won(100%, isWonStage), lost(0%, isLostStage).

## Verification

- Seed скрипт выполнился успешно, создал Pipeline и 8 DealStage записей
- API endpoints созданы по аналогии с contacts API
- DealRepository.moveStage записывает DealHistory

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

None.
