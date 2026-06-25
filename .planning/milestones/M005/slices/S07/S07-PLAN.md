# S07: Поставки

**Goal:** Реализовать функциональность поставок (Delivery)
**Demo:** Логист создаёт поставку из счёта, отслеживает статусы (pending→shipped→in_transit→delivered), при delivered — автообновление склада

## Must-Haves

- Delivery CRUD, create-from-invoice, auto warehouse update, status tracking, UI

## Proof Level

- This slice proves: Production-ready code with tests

## Integration Closure

Интеграция с Invoice (связь со счетом), Warehouse (автоматическое обновление остатков), PurchaseRequest (закрытие цикла)

## Verification

- Status machine tracking, warehouse update logging

## Tasks

- [x] **T01: DeliveryRepository — status machine + auto warehouse update** `est:5h`
  Создать repository для Delivery с status machine и автоматическим обновлением склада
  - Files: `apps/backend/src/modules/delivery/delivery.repository.ts`
  - Verify: Unit tests pass

- [x] **T02: DeliveryApiClient + API types + tests** `est:2h`
  Создать API клиент и типы для Delivery
  - Files: `apps/backend/src/modules/delivery/api-types.ts`, `apps/frontend/src/api/delivery-client.ts`
  - Verify: Unit tests pass

- [x] **T03: Delivery API Routes — REST endpoints** `est:3h`
  Создать REST endpoints для Delivery
  - Files: `apps/backend/src/modules/delivery/delivery.routes.ts`
  - Verify: Manual API testing

- [x] **T04: Delivery UI — list, create-from-invoice, status tracking** `est:6h`
  Создать UI для списка поставок, создания из счета, отслеживания статусов
  - Files: `apps/frontend/src/modules/delivery/delivery-list.tsx`, `apps/frontend/src/modules/delivery/delivery-detail.tsx`
  - Verify: Manual UI testing

## Files Likely Touched

- apps/backend/src/modules/delivery/delivery.repository.ts
- apps/backend/src/modules/delivery/api-types.ts
- apps/frontend/src/api/delivery-client.ts
- apps/backend/src/modules/delivery/delivery.routes.ts
- apps/frontend/src/modules/delivery/delivery-list.tsx
- apps/frontend/src/modules/delivery/delivery-detail.tsx
