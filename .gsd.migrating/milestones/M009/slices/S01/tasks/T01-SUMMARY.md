---
id: T01
parent: S01
milestone: M009
key_files:
  - apps/web/src/lib/db/deals.ts
key_decisions: []
duration: 
verification_result: untested
completed_at: 2026-06-21T09:28:15.313Z
blocker_discovered: false
---

# T01: DealRepository создан с методами CRUD, moveStage, автонумерацией С-YYYY-NNNNN

**DealRepository создан с методами CRUD, moveStage, автонумерацией С-YYYY-NNNNN**

## What Happened

Создан apps/web/src/lib/db/deals.ts по аналогии с contacts.ts. Класс DealRepository с методами: findMany (с фильтрами pipelineId, stageId, managerId, contactId), findUnique, findBy* (Pipeline, Stage, Manager, Contact), create (генерация номера С-YYYY-NNNNN), update, moveStage (записывает DealHistory), softDelete, count, getHistory.

moveStage проверяет существование сделки, создаёт DealHistory запись, обновляет stageId, устанавливает actualCloseDate/closedAt если moved to won/lost stage.

## Verification

DealRepository создан, все методы реализованы, moveStage записывает DealHistory. Seed скрипт использует pipeline/stage из БД.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/db/deals.ts`
