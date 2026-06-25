---
id: S03
parent: M005
milestone: M005
provides:
  - (none)
requires:
  []
affects:
  []
key_files:
  - ["apps/backend/src/modules/purchase-request/purchase-request.repository.ts", "apps/backend/src/modules/purchase-request/purchase-request.routes.ts", "apps/frontend/src/modules/purchase-request/purchase-request-list.tsx", "apps/frontend/src/modules/purchase-request/purchase-request-detail.tsx"]
key_decisions:
  - ["Использование status machine для управления жизненным циклом запроса", "Группировка BOM items по поставщикам при создании запроса", "Email уведомления через существующий механизм"]
patterns_established:
  - (none)
observability_surfaces:
  - none
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-06-24T02:38:09.074Z
blocker_discovered: false
---

# S03: Запросы поставщикам

**PurchaseRequest feature — CRUD, BOM grouping, email sending, UI list/detail/create-from-BOM**

## What Happened

## Реализация S03: Запросы поставщикам

### Выполненная работа

**Backend:**
- `7e4b6c0` PurchaseRequestRepository — CRUD, BOM grouping, email, status machine
- `2a2a1dd` PurchaseRequestApiClient + API types + tests
- `dde94c7` PurchaseRequest API Routes — REST endpoints

**Frontend:**
- `ecb7ca5` Purchase Request UI — list, create-from-BOM grouping, detail

### Ключевые файлы
- `apps/backend/src/modules/purchase-request/purchase-request.repository.ts`
- `apps/backend/src/modules/purchase-request/purchase-request.routes.ts`
- `apps/backend/src/modules/purchase-request/api-types.ts`
- `apps/frontend/src/modules/purchase-request/purchase-request-list.tsx`
- `apps/frontend/src/modules/purchase-request/purchase-request-detail.tsx`

### Интеграции
- BOM: возможность создавать запросы на основе BOM с группировкой по поставщикам
- Counterparty: связь с контрагентами-поставщиками
- Email: уведомления при отправке запросов

## Verification

- Коммиты `7e4b6c0`, `2a2a1dd`, `dde94c7`, `ecb7ca5` реализуют полный стек
- Doc commit `3121a2e` подтверждает завершение slice
- Repository, API routes, UI components созданы и протестированы

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
