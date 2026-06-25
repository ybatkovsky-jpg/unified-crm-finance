# S01: Контрагенты (поставщики)

**Goal:** Пользователь создаёт контрагента типа supplier с банковскими реквизитами, видит список с фильтрами, открывает карточку с историей запросов/счетов/поставок
**Demo:** Пользователь создаёт контрагента типа supplier с банковскими реквизитами, видит список с фильтрами, открывает карточку с историей запросов/счетов/поставок

## Must-Haves

- Repository tests pass (CRUD + soft-delete + findByInn + count)
- API client tests pass (mocked fetch covering all CRUD + error paths)
- API routes return correct JSON shapes for GET/POST/PUT/DELETE with proper status codes
- UI list page renders with type filter (supplier/all) and search bar, supports create via modal
- UI detail page renders with header card, bank details, and history tabs (Purchase Requests, Invoices, Deliveries)
- TypeScript compilation succeeds with no errors

## Proof Level

- This slice proves: contract

## Integration Closure

S01 is the first M005 slice — no upstream M005 dependencies. It follows the established Contact/Deal/Project pattern (5-layer architecture: Repository → API Client → API Route → UI Page). New wiring: API routes at /api/counterparties expose counterparties repository; UI pages at /procurement/counterparties consume API client via fetch. Downstream slices (S02–S07) depend on S01 providing the Counterparty CRUD surface and the /procurement route prefix. What remains before M005 is usable end-to-end: S02 (BOM), S03 (Purchase Requests), S04 (Invoices), S05 (Approvals), S06 (Warehouse), S07 (Delivery).

## Verification

- Structured API error responses (400/404/500) with { error, message } shape matching existing convention. Console.error on API route failures with error.message. Repository throws descriptive Error('Counterparty with id X not found') for not-found cases. Soft-delete is idempotent — calling DELETE on an already-deleted counterparty returns 404. findAll excludes soft-deleted records via deletedAt: null filter.

## Tasks

- [x] **T01: Create CounterpartyRepository with tests** `est:medium`
  Why: Repository is the data-access foundation. Must follow the exact ContactRepository pattern (singleton, soft-delete filtering, UUID generation, manual updatedAt).
  - Files: `apps/web/src/lib/db/counterparties.ts`, `apps/web/src/lib/db/counterparties.test.ts`
  - Verify: npx tsx --test src/lib/db/counterparties.test.ts

- [x] **T02: Add API types and create CounterpartyApiClient with tests** `est:medium`
  Why: API client is the typed bridge between UI and backend. Must follow ContactApiClient pattern (class with injectable fetch, singleton + convenience exports). Types must be added to shared types.ts.
  - Files: `apps/web/src/lib/api/types.ts`, `apps/web/src/lib/api/counterparties.ts`, `apps/web/src/lib/api/counterparties.test.ts`
  - Verify: npx tsx --test src/lib/api/counterparties.test.ts

- [x] **T03: Create API routes for counterparties collection and single resource** `est:small`
  Why: API routes are the HTTP contract that UI pages consume. Must follow the exact contacts route pattern (Next.js App Router, error shape, status codes).
  - Files: `apps/web/src/app/api/counterparties/route.ts`, `apps/web/src/app/api/counterparties/[id]/route.ts`
  - Verify: npx tsc --noEmit

- [x] **T04: Create UI list page with filters and create modal** `est:medium`
  Why: The list page is the primary user-facing surface for managing counterparties. Must follow ContactListPage patterns (client component, loading/error/empty states, filter bar, table with links to detail).
  - Files: `apps/web/src/app/procurement/counterparties/page.tsx`, `apps/web/src/components/procurement/counterparty-form.tsx`
  - Verify: npx tsc --noEmit

- [x] **T05: Create UI detail page with history tabs** `est:medium`
  Why: The detail page is where users inspect a single counterparty and see its related history (purchase requests, invoices, deliveries). Must follow ContactDetailPage patterns (back nav, header card, data grid).
  - Files: `apps/web/src/app/procurement/counterparties/[id]/page.tsx`, `apps/web/src/components/procurement/counterparty-history.tsx`
  - Verify: npx tsc --noEmit

- [x] **T06: Add procurement navigation links to app layout** `est:trivial`
  Why: Users need a way to reach /procurement/counterparties from the app. The current layout.tsx is minimal (just <body>{children}</body>). Add a simple top nav bar or sidebar with links to all modules including the new Procurement section.
  - Files: `apps/web/src/app/layout.tsx`
  - Verify: npx tsc --noEmit

## Files Likely Touched

- apps/web/src/lib/db/counterparties.ts
- apps/web/src/lib/db/counterparties.test.ts
- apps/web/src/lib/api/types.ts
- apps/web/src/lib/api/counterparties.ts
- apps/web/src/lib/api/counterparties.test.ts
- apps/web/src/app/api/counterparties/route.ts
- apps/web/src/app/api/counterparties/[id]/route.ts
- apps/web/src/app/procurement/counterparties/page.tsx
- apps/web/src/components/procurement/counterparty-form.tsx
- apps/web/src/app/procurement/counterparties/[id]/page.tsx
- apps/web/src/components/procurement/counterparty-history.tsx
- apps/web/src/app/layout.tsx
