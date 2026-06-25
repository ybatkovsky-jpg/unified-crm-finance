# S05: Согласование оплаты

**Goal:** Реализовать функциональность согласования оплаты (Approval Request)
**Demo:** Менеджер создаёт заявку на оплату счёта, owner получает уведомление, одобряет или отклоняет с комментарием

## Must-Haves

- ApprovalRequest CRUD, create-from-invoice, decide workflow, UI list/decide

## Proof Level

- This slice proves: Production-ready code with tests

## Integration Closure

Интеграция с Invoice (связь со счетом), Counterparty (поставщики), Email (уведомления)

## Verification

- Status machine tracking, approval decision logging, email delivery logging

## Tasks

- [x] **T01: ApprovalRequestRepository — create, decide, notify** `est:4h`
  Создать repository для ApprovalRequest с поддержкой CRUD, decide workflow, email notifications
  - Files: `apps/backend/src/modules/approval-request/approval-request.repository.ts`
  - Verify: Unit tests pass

- [x] **T02: ApprovalRequestApiClient + API types + tests** `est:2h`
  Создать API клиент и типы для ApprovalRequest
  - Files: `apps/backend/src/modules/approval-request/api-types.ts`, `apps/frontend/src/api/approval-request-client.ts`
  - Verify: Unit tests pass

- [x] **T03: ApprovalRequest API Routes — REST endpoints** `est:3h`
  Создать REST endpoints для ApprovalRequest
  - Files: `apps/backend/src/modules/approval-request/approval-request.routes.ts`
  - Verify: Manual API testing

- [x] **T04: Approval UI — list, create-from-invoice, decide** `est:6h`
  Создать UI для списка заявок на согласование, создания из счета, принятия решений
  - Files: `apps/frontend/src/modules/approval-request/approval-request-list.tsx`, `apps/frontend/src/modules/approval-request/approval-request-detail.tsx`
  - Verify: Manual UI testing

## Files Likely Touched

- apps/backend/src/modules/approval-request/approval-request.repository.ts
- apps/backend/src/modules/approval-request/api-types.ts
- apps/frontend/src/api/approval-request-client.ts
- apps/backend/src/modules/approval-request/approval-request.routes.ts
- apps/frontend/src/modules/approval-request/approval-request-list.tsx
- apps/frontend/src/modules/approval-request/approval-request-detail.tsx
