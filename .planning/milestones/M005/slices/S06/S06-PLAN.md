# S06: Склад

**Goal:** Реализовать функциональность склада (Warehouse)
**Demo:** Кладовщик видит список складских позиций с цветовой индикацией остатков, выполняет приход/расход/резерв, получает alert при минимальном остатке

## Must-Haves

- Warehouse items CRUD, atomic stock transactions, UI list/detail with transactions

## Proof Level

- This slice proves: Production-ready code with tests

## Integration Closure

Интеграция с PurchaseRequest (приемка), Delivery (отгрузка), Invoice (списание)

## Verification

- Stock change logging, transaction history, balance alerts

## Tasks

- [x] **T01: WarehouseRepository — items + atomic stock transactions** `est:5h`
  Создать repository для Warehouse с items и атомарными транзакциями остатков
  - Files: `apps/backend/src/modules/warehouse/warehouse.repository.ts`
  - Verify: Unit tests pass

- [x] **T02: WarehouseApiClient + API types + tests** `est:2h`
  Создать API клиент и типы для Warehouse
  - Files: `apps/backend/src/modules/warehouse/api-types.ts`, `apps/frontend/src/api/warehouse-client.ts`
  - Verify: Unit tests pass

- [x] **T03: Warehouse API Routes — REST endpoints** `est:3h`
  Создать REST endpoints для Warehouse
  - Files: `apps/backend/src/modules/warehouse/warehouse.routes.ts`
  - Verify: Manual API testing

- [x] **T04: Warehouse UI — list (color-coded balances) + detail/transactions** `est:6h`
  Создать UI для списка складов с цветовой индикацией балансов, страница детализации с транзакциями
  - Files: `apps/frontend/src/modules/warehouse/warehouse-list.tsx`, `apps/frontend/src/modules/warehouse/warehouse-detail.tsx`
  - Verify: Manual UI testing

## Files Likely Touched

- apps/backend/src/modules/warehouse/warehouse.repository.ts
- apps/backend/src/modules/warehouse/api-types.ts
- apps/frontend/src/api/warehouse-client.ts
- apps/backend/src/modules/warehouse/warehouse.routes.ts
- apps/frontend/src/modules/warehouse/warehouse-list.tsx
- apps/frontend/src/modules/warehouse/warehouse-detail.tsx
