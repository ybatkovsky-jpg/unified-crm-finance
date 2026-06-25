# S02: Спецификация (BOM)

**Goal:** Пользователь загружает Excel-спецификацию в проект, система парсит позиции (клиентский SheetJS), редактирует в таблице, назначает поставщиков из выпадающего списка контрагентов, блокирует спецификацию
**Demo:** Пользователь загружает Excel-спецификацию в проект, AI парсит позиции, редактирует в таблице, назначает поставщиков, блокирует спецификацию

## Must-Haves

- Repository tests pass (BOM + BOMItem CRUD, lock/unlock). API client tests pass (typed methods, error handling). TypeScript compiles without new errors. BOM Section renders as a Card on the project detail page with: Excel file upload + SheetJS client-side parsing with column mapping, editable items table (inline edit for name/qty/price/unit/category), supplier assignment dropdown (fetches from S01 Counterparty API), and lock/unlock toggle. Locked BOM disables all edit controls.

## Proof Level

- This slice proves: contract

## Integration Closure

Upstream: Counterparty API (S01 supplier list via GET /api/counterparties?type=supplier), FileEntity API (upload Excel via /api/files), Project API (project context). New wiring: BOM section Card added to project detail page at apps/web/src/app/projects/[id]/page.tsx alongside existing Production/Files/Related sections. Remaining: Python AI parsing (deferred — worker has no webhook endpoints), BOM versioning (deferred — field exists, always v1 for now), BOM history tracking (deferred).

## Verification

- Runtime signals: BOM status transitions (draft→locked) logged via console in API routes. Inspection surfaces: GET /api/bom?projectId=X returns current BOM state with all items and their supplier assignments. GET /api/bom/[id] returns single BOM with computed total. Failure visibility: API routes log errors to console.error with structured messages; API client throws ApiClientError with statusCode + message.

## Tasks

- [x] **T01: BOMRepository — CRUD for BOM and BOMItem** `est:45m`
  Why: Foundation data layer. Without BOMRepository, no other layer can function. The BOM model has a @unique projectId constraint (1 BOM per project), and BOMItem is a child with onDelete: Cascade.
  - Files: `apps/web/src/lib/db/bom.ts`, `apps/web/src/lib/db/bom.test.ts`
  - Verify: npx tsx --test src/lib/db/bom.test.ts

- [x] **T02: BOMApiClient + API types + tests** `est:45m`
  Why: Typed API client layer between UI components and API routes. Following the CounterpartyApiClient pattern proven in S01.
  - Files: `apps/web/src/lib/api/bom.ts`, `apps/web/src/lib/api/bom.test.ts`, `apps/web/src/lib/api/types.ts`
  - Verify: npx tsx --test src/lib/api/bom.test.ts

- [x] **T03: BOM API Routes — REST endpoints** `est:45m`
  Why: HTTP API surface for BOM CRUD. Follows the established App Router pattern from S01 counterparty routes. All routes use NextResponse.json({ data }) for success, { error, message } for errors.
  - Files: `apps/web/src/app/api/bom/route.ts`, `apps/web/src/app/api/bom/[id]/route.ts`, `apps/web/src/app/api/bom/[id]/items/route.ts`, `apps/web/src/app/api/bom/items/[id]/route.ts`, `apps/web/src/app/api/bom/[id]/lock/route.ts`
  - Verify: npx tsx --test src/lib/db/bom.test.ts

- [x] **T04: BOM Section UI — Excel upload, editable table, supplier assignment, lock** `est:1h 15m`
  Why: User-facing BOM management UI. The core value prop of S02 is Excel→BOM parsing + editing. This task creates all BOM UI components and integrates them into the project detail page.
  - Files: `apps/web/src/components/procurement/bom-section.tsx`, `apps/web/src/app/projects/[id]/page.tsx`, `apps/web/package.json`
  - Verify: npx tsx --test src/lib/db/bom.test.ts

## Files Likely Touched

- apps/web/src/lib/db/bom.ts
- apps/web/src/lib/db/bom.test.ts
- apps/web/src/lib/api/bom.ts
- apps/web/src/lib/api/bom.test.ts
- apps/web/src/lib/api/types.ts
- apps/web/src/app/api/bom/route.ts
- apps/web/src/app/api/bom/[id]/route.ts
- apps/web/src/app/api/bom/[id]/items/route.ts
- apps/web/src/app/api/bom/items/[id]/route.ts
- apps/web/src/app/api/bom/[id]/lock/route.ts
- apps/web/src/components/procurement/bom-section.tsx
- apps/web/src/app/projects/[id]/page.tsx
- apps/web/package.json
