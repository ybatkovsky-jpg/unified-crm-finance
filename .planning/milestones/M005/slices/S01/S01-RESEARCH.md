# Research: Slice S01 -- Counterparty (Supplier) Management

## Summary

**Depth calibration**: Full-stack slice (repository + API + UI) following the established Contact/Deal/Project pattern. The Prisma model `Counterparty` already exists and is migrated. Zero feature code exists -- no repository, no API client, no API routes, no UI pages. This is a greenfield implementation within well-established conventions.

**Known**: Prisma model fields, relations (BOMItem, PurchaseRequest, Invoice, Delivery, EmailLog, Transaction, CashFlowPayment), soft-delete support, indexes on `type` and `inn`.

**New**: Everything else -- five layers of implementation.

---

## Requirements Coverage

| Requirement | Status | Notes |
|---|---|---|
| PROC-46: Counterparty with type `supplier` | Model exists | `Counterparty.type` is a String field. `Counterparty.types` is a JSON array (for multi-type support). Filter by `type='supplier'` is straightforward. |
| PROC-47: Fields (name, INN, KPP, email, phone, contactPerson, address, bank details, notes, rating) | Model exists | All fields present in schema. Bank details: `bankName`, `bankAccount`, `korAccount`, `bik`. |
| PROC-48: Excel import (Should) | Not implemented | Not in scope for S01. Defer to future slice. |
| PROC-49: History card (requests, invoices, deliveries) | Relations exist | `Counterparty` has relations to `PurchaseRequest[]`, `Invoice[]`, `Delivery[]` via `supplierId`. Detail page must include tabs for each. |

---

## Existing Code Audit

### What EXISTS

1. **Prisma model** (`apps/web/prisma/schema.prisma` lines 296-327):
   ```prisma
   model Counterparty {
     id              String            @id
     name            String
     type            String            // "supplier", "customer", etc.
     types           Json              @default("[]")
     inn             String?
     kpp             String?
     email           String?
     phone           String?
     contactPerson   String?
     address         String?
     bankName        String?
     bankAccount     String?
     korAccount      String?
     bik             String?
     notes           String?
     rating          Int?
     attributes      Json?
     createdAt       DateTime          @default(now())
     updatedAt       DateTime
     deletedAt       DateTime?
     // Relations:
     BOMItem         BOMItem[]
     CashFlowPayment CashFlowPayment[]
     Delivery        Delivery[]
     EmailLog        EmailLog[]
     Invoice         Invoice[]
     PurchaseRequest PurchaseRequest[]
     Transaction     Transaction[]
   }
   ```

2. **Migration**: The `20260621045822_003_complete_schema` migration already created the Counterparty table with all columns, indexes on `type` and `inn`.

3. **Reference implementation patterns** (fully established):
   - Repository: `src/lib/db/contacts.ts` -- class with findMany, findUnique, findByX, create, update, softDelete, count, existsBy; exports singleton
   - API client: `src/lib/api/contacts.ts` -- class wrapping fetch with typed methods; exports singleton + convenience functions
   - Types: `src/lib/api/types.ts` -- ContactData, ContactCreateInput, ContactUpdateInput, etc.
   - API routes: `src/app/api/contacts/route.ts` (GET list + POST create), `src/app/api/contacts/[id]/route.ts` (GET + PUT + DELETE)
   - UI list: `src/app/crm/contacts/page.tsx` -- client component with filters, table, loading/error/empty states
   - UI detail: `src/app/crm/contacts/[id]/page.tsx` -- client component with header card, detail fields, interactions timeline
   - Tests: both repository (`contacts.test.ts`) and API client (`contacts.test.ts`) use `node:test` framework with `tsx`

### What is MISSING (complete list)

| Layer | File | Pattern Source |
|---|---|---|
| Repository | `src/lib/db/counterparties.ts` | `contacts.ts` |
| Repository tests | `src/lib/db/counterparties.test.ts` | `contacts.test.ts` |
| API client | `src/lib/api/counterparties.ts` | `contacts.ts` |
| API client tests | `src/lib/api/counterparties.test.ts` | `contacts.test.ts` |
| API types | Add to `src/lib/api/types.ts` | Follow ContactData pattern |
| API route (collection) | `src/app/api/counterparties/route.ts` | `contacts/route.ts` |
| API route (single) | `src/app/api/counterparties/[id]/route.ts` | `contacts/[id]/route.ts` |
| UI list page | `src/app/procurement/counterparties/page.tsx` | `crm/contacts/page.tsx` |
| UI detail page | `src/app/procurement/counterparties/[id]/page.tsx` | `crm/contacts/[id]/page.tsx` |
| UI components | `src/components/procurement/` (new directory) | -- |
| Navigation | Sidebar/nav link to `/procurement/counterparties` | Check existing layout.tsx |

---

## Implementation Landscape

### Architecture Seam

The existing pattern follows a strict 5-layer architecture with clean separation:

```
UI Pages (src/app/)               -- "use client", calls API client
  -> API Client (src/lib/api/)    -- typed fetch wrapper, throws ApiClientError
    -> API Route (src/app/api/)   -- Next.js App Router route handler
      -> Repository (src/lib/db/) -- Prisma wrapper, singleton export
        -> Prisma Schema          -- auto-generated types
```

### Files to CREATE

1. **`src/lib/db/counterparties.ts`** -- Repository class:
   - `findMany(params?)` -- filters by type (supplier/customer), status, search (name/inn)
   - `findUnique(id, include?)` -- with optional include of PurchaseRequest/Invoice/Delivery
   - `findByInn(inn)` -- dedup check
   - `findByType(type)` -- filtered list
   - `create(data)` -- UUID + timestamp generation
   - `update(id, data)` -- verify exists first
   - `softDelete(id)` -- set deletedAt
   - `count(where?)`
   - Singleton export: `export const counterparties = new CounterpartyRepository()`

2. **`src/lib/db/counterparties.test.ts`** -- Tests using `node:test`:
   - create, findUnique, findMany, update, softDelete, findByInn, count

3. **`src/lib/api/types.ts`** -- Add types:
   - `CounterpartyData` (Omit<Counterparty, 'deletedAt'>)
   - `CounterpartyCreateInput`, `CounterpartyUpdateInput`
   - `CounterpartyFilters` (type, search, rating)
   - `CounterpartyListParams` (extends Filters + PaginationOptions)

4. **`src/lib/api/counterparties.ts`** -- API client:
   - `getCounterparties(params?)`
   - `getCounterparty(id)`
   - `createCounterparty(data)`
   - `updateCounterparty(id, data)`
   - `deleteCounterparty(id)`
   - Singleton + convenience exports

5. **`src/lib/api/counterparties.test.ts`** -- Mocked fetch tests

6. **`src/app/api/counterparties/route.ts`** -- Collection:
   - `GET` -- list with filters (type, search=name/inn)
   - `POST` -- create with validation (name required, type must be supplier/customer)

7. **`src/app/api/counterparties/[id]/route.ts`** -- Single:
   - `GET` -- detail with history relations (optional include via query param)
   - `PUT` -- partial update
   - `DELETE` -- soft delete

8. **`src/app/procurement/counterparties/page.tsx`** -- List page:
   - Filters: type (supplier/all), search bar (name/inn)
   - Table: Name, INN, Email, Phone, Rating, Status badges
   - Loading/error/empty states (same pattern as contacts)
   - Create button opening a modal

9. **`src/app/procurement/counterparties/[id]/page.tsx`** -- Detail page:
   - Header card: name, type badge, INN/KPP, bank details
   - Tabs: Details, Purchase Requests, Invoices, Deliveries
   - Each tab fetches related data (or use include on the counterparty GET)

10. **`src/components/procurement/`** -- New component directory:
    - `counterparty-form.tsx` -- create/edit form (name, inn, kpp, bank details, etc.)
    - `counterparty-history.tsx` -- reusable table component for history tabs

### Natural Seams (Task Boundaries)

| Task | Description | Dependencies |
|---|---|---|
| T01 | Repository + tests | None |
| T02 | API types + API client + tests | T01 |
| T03 | API routes (collection + single) | T01 |
| T04 | UI list page + create modal | T02, T03 |
| T05 | UI detail page with history tabs | T02, T03 |
| T06 | Navigation links + sidebar | T04 |

Tasks T01-T03 are backend, T04-T06 are frontend. T04 and T05 can be parallelized once T03 is complete.

---

## First Proof (Highest Risk)

**Risk**: The `Counterparty` model has `updatedAt` without `@updatedAt` in the schema. This means the repository must manually set `updatedAt` on every update. Same pattern as Contact/Deal/Project -- confirmed by memory MEM069.

**First proof**: Build and test the Repository layer first:

```bash
# Create repository and run tests
npx tsx --test src/lib/db/counterparties.test.ts
```

Key edge cases to verify in the first proof:
1. Soft-delete filtering (findMany should exclude deletedAt != null)
2. findByInn returns null when no match
3. update throws when entity is soft-deleted
4. Counterparty with `type='supplier'` is distinct from `type='customer'`

---

## Verification

### Unit tests:
```bash
# Repository tests (real Prisma against dev.db)
npx tsx --test src/lib/db/counterparties.test.ts

# API client tests (mocked fetch)
npx tsx --test src/lib/api/counterparties.test.ts
```

### TypeScript compilation:
```bash
cd apps/web && npm run build
```

### Manual API smoke test (after T03):
```bash
# List counterparties (empty)
curl http://localhost:3000/api/counterparties

# Create a supplier
curl -X POST http://localhost:3000/api/counterparties \
  -H "Content-Type: application/json" \
  -d '{"name":"ООО Поставщик","type":"supplier","inn":"7701234567","bankName":"Сбербанк","bankAccount":"40702810900000000001","bik":"044525225"}'

# Get by ID
curl http://localhost:3000/api/counterparties/{id}

# Filter by type
curl "http://localhost:3000/api/counterparties?type=supplier"
```

### UI verification:
- Navigate to `/procurement/counterparties`
- Verify list renders with filters
- Click through to detail page
- Verify history tabs render related entities (empty states for MVP)

---

## Recommendation

### Task decomposition for the planner:

**T01 -- Repository (CounterpartyRepository)**
- Files: `src/lib/db/counterparties.ts`, `src/lib/db/counterparties.test.ts`
- Methods: findMany, findUnique, findByInn, findByType, create, update, softDelete, count
- Singleton export: `counterparties`
- Test: create -> findUnique -> update -> findByInn -> softDelete -> verify excluded from findMany
- Estimate: medium

**T02 -- API Client + Types**
- Files: `src/lib/api/types.ts` (add types), `src/lib/api/counterparties.ts`, `src/lib/api/counterparties.test.ts`
- Types: CounterpartyData, CounterpartyCreateInput, CounterpartyUpdateInput, CounterpartyFilters
- API client: getCounterparties, getCounterparty, createCounterparty, updateCounterparty, deleteCounterparty
- Singleton + convenience exports
- Test: mocked fetch, all CRUD paths, error handling
- Estimate: medium

**T03 -- API Routes**
- Files: `src/app/api/counterparties/route.ts`, `src/app/api/counterparties/[id]/route.ts`
- GET /api/counterparties -- list with filters (type, search)
- POST /api/counterparties -- create with validation
- GET /api/counterparties/[id] -- detail with include
- PUT /api/counterparties/[id] -- update
- DELETE /api/counterparties/[id] -- soft delete
- Consistent error format: `{ error, message }` + appropriate status codes
- Estimate: small

**T04 -- UI List Page**
- Files: `src/app/procurement/counterparties/page.tsx`, `src/components/procurement/counterparty-form.tsx`
- Filter bar: type (supplier/all), search by name/INN
- Table: Name, INN, Phone, Email, Rating, Status, Actions
- Badge variants: supplier=secondary, customer=default
- Loading/error/empty states (match contacts pattern)
- Create modal with form
- Estimate: medium

**T05 -- UI Detail Page with History**
- Files: `src/app/procurement/counterparties/[id]/page.tsx`, `src/components/procurement/counterparty-history.tsx`
- Back navigation
- Header card: name, type badge, INN/KPP, bank details display
- Tabs: Details (all fields), Purchase Requests (table), Invoices (table), Deliveries (table)
- Each history tab: fetch on mount with loading state, empty state if no records
- Estimate: medium

**T06 -- Navigation**
- Files: Check `src/app/layout.tsx` or equivalent for sidebar/nav
- Add link: "Procurement" > "Counterparties" -> `/procurement/counterparties`
- Estimate: trivial

### Execution order: T01 -> T02 -> T03 -> (T04 + T05 in parallel) -> T06
### Slice completion check: List page renders, detail page renders, create form works, filters work
