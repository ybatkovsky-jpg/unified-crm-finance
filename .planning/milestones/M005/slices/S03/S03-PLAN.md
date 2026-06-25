# S03: Запросы поставщикам

**Goal:** Реализовать функциональность запросов поставщикам (Purchase Request)
**Demo:** Менеджер группирует BOM-позиции по поставщикам, создаёт PurchaseRequest, видит email-превью, отправляет запрос (через лог), отслеживает статусы

## Must-Haves

- Purchase Request CRUD, BOM grouping, email sending, UI complete

## Proof Level

- This slice proves: Production-ready code with tests

## Integration Closure

Интеграция с BOM (группировка по поставщикам), Counterparty (поставщики), Email (уведомления)

## Verification

- Status machine tracking, email delivery logging

## Tasks

- [x] **T01: PurchaseRequestRepository — CRUD, BOM grouping, email, status machine** `est:4h`
  Создать repository для PurchaseRequest с поддержкой CRUD, группировкой по BOM и поставщикам, email отправкой, status machine
  - Files: `apps/backend/src/modules/purchase-request/purchase-request.repository.ts`
  - Verify: Unit tests pass

- [x] **T02: PurchaseRequestApiClient + API types + tests** `est:2h`
  Создать API клиент и типы для PurchaseRequest
  - Files: `apps/backend/src/modules/purchase-request/api-types.ts`, `apps/frontend/src/api/purchase-request-client.ts`
  - Verify: Unit tests pass

- [x] **T03: PurchaseRequest API Routes — REST endpoints** `est:3h`
  Создать REST endpoints для PurchaseRequest
  - Files: `apps/backend/src/modules/purchase-request/purchase-request.routes.ts`
  - Verify: Manual API testing

- [x] **T04: Purchase Request UI — list, create-from-BOM grouping, detail** `est:6h`
  Создать UI для списка запросов, создания из BOM с группировкой, детализации
  - Files: `apps/frontend/src/modules/purchase-request/purchase-request-list.tsx`, `apps/frontend/src/modules/purchase-request/purchase-request-detail.tsx`
  - Verify: Manual UI testing

## Files Likely Touched

- apps/backend/src/modules/purchase-request/purchase-request.repository.ts
- apps/backend/src/modules/purchase-request/api-types.ts
- apps/frontend/src/api/purchase-request-client.ts
- apps/backend/src/modules/purchase-request/purchase-request.routes.ts
- apps/frontend/src/modules/purchase-request/purchase-request-list.tsx
- apps/frontend/src/modules/purchase-request/purchase-request-detail.tsx
