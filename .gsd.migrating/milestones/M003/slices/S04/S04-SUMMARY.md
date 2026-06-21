---
id: S04
parent: M009
milestone: M009
provides:
  - []
requires:
  []
affects:
  []
key_files:
  - ["apps/web/src/lib/db/contracts.ts", "apps/web/src/app/api/contracts/route.ts", "apps/web/src/app/api/contracts/[id]/route.ts", "apps/web/src/app/api/contracts/[id]/versions/route.ts", "apps/web/src/app/api/contracts/[id]/signers/route.ts", "apps/web/src/app/api/deals/[id]/convert/route.ts"]
key_decisions:
  - ["Версионность контрактов через отдельную таблицу ContractVersion с инкрементом", "Подписи через ContractSigner (много подписантов на один контракт)", "Конвертация Deal→Contract в отдельном endpoint для явного действия"]
patterns_established:
  - ["Repository паттерн для всех сущностей", "Nested routes для sub-entities (versions, signers)", "Конвертация сущностей через отдельный endpoint"]
observability_surfaces:
  - ["console.error для API errors", "404/409/500 статусы с понятными сообщениями", "createdAt/updatedAt для аудита"]
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-06-21T09:39:02.344Z
blocker_discovered: false
---

# S04: Contract API

**Contract API с версионностью, подписантами, конвертацией из сделки**

## What Happened

Создан полный API для контрактов с версионностью и подписантами.

ContractRepository (apps/web/src/lib/db/contracts.ts): методы findMany, findUnique, findByContact, findByDeal, create (автонумерация Д-YYYY-NNNNN), update, softDelete. addVersion (автоинкремент версии), getVersions. addSigner, getSigners. convertFromDeal (конвертация сделки в контракт, связывает dealId).

API endpoints: GET/POST /api/contracts, GET/PATCH/DELETE /api/contracts/[id], GET/POST /api/contracts/[id]/versions, GET/POST /api/contracts/[id]/signers. POST /api/deals/[id]/convert для конвертации.

## Verification

ContractRepository создан с методами CRUD, версионностью, подписантами. API endpoints работают, конвертация Deal→Contract создана.

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
