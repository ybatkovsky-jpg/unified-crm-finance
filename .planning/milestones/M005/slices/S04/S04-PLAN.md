# S04: Счета от поставщиков

**Goal:** Реализовать функциональность счетов от поставщиков (Invoice)
**Demo:** Бухгалтер загружает счёт (PDF/Excel) или система получает его через email, AI сверяет позиции с заказом, показывает diff, менеджер подтверждает сверку

## Must-Haves

- Invoice CRUD, manual upload, reconciliation/diff UI complete

## Proof Level

- This slice proves: Production-ready code with tests

## Integration Closure

Интеграция с Counterparty (поставщики), PurchaseRequest (опциональная связь), Warehouse (приемка)

## Verification

- Status machine tracking, reconciliation logging

## Tasks

- [x] **T01: InvoiceRepository — CRUD, manual matching, status machine** `est:4h`
  Создать repository для Invoice с поддержкой CRUD, ручным matching, status machine
  - Files: `apps/backend/src/modules/invoice/invoice.repository.ts`
  - Verify: Unit tests pass

- [x] **T02: InvoiceApiClient + API types + tests** `est:2h`
  Создать API клиент и типы для Invoice
  - Files: `apps/backend/src/modules/invoice/api-types.ts`, `apps/frontend/src/api/invoice-client.ts`
  - Verify: Unit tests pass

- [x] **T03: Invoice API Routes — REST endpoints** `est:3h`
  Создать REST endpoints для Invoice
  - Files: `apps/backend/src/modules/invoice/invoice.routes.ts`
  - Verify: Manual API testing

- [x] **T04: Invoice UI — list, manual upload, reconciliation/diff** `est:6h`
  Создать UI для списка счетов, ручной загрузки, сверки/diff
  - Files: `apps/frontend/src/modules/invoice/invoice-list.tsx`, `apps/frontend/src/modules/invoice/invoice-detail.tsx`
  - Verify: Manual UI testing

## Files Likely Touched

- apps/backend/src/modules/invoice/invoice.repository.ts
- apps/backend/src/modules/invoice/api-types.ts
- apps/frontend/src/api/invoice-client.ts
- apps/backend/src/modules/invoice/invoice.routes.ts
- apps/frontend/src/modules/invoice/invoice-list.tsx
- apps/frontend/src/modules/invoice/invoice-detail.tsx
