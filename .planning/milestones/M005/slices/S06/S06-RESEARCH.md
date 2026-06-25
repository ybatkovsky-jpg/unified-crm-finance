# S06 Research: Склад (Warehouse / Inventory)

## Summary

The Warehouse (Склад) slice implements inventory management for the Procurement module. This research was conducted by reading the Prisma schema, the M005 procurement requirements document, and auditing existing architectural patterns across the codebase.

**Depth calibration**: Low uncertainty. The Prisma schema already defines `WarehouseItem` and `WarehouseTransaction` models with complete fields. The requirements are clearly specified (PROC-34 through PROC-40). The codebase has mature, well-documented Repository and API patterns to follow. No warehouse feature code exists yet -- everything must be built from scratch, but the path is clear.

**What's known for certain**:
- Prisma models are already defined and migrated (`WarehouseItem`, `WarehouseTransaction` with relations)
- Requirements are documented (PROC-34 to PROC-40) with clear acceptance criteria
- Repository pattern is consistent across all entities (see `DealRepository`, `ProductionRepository`)
- API route pattern follows Next.js App Router with standardized error handling
- shadcn/ui component library is set up and in active use
- No warehouse feature code exists yet (no routes, no db repository, no components, no API client)

---

## Requirements Coverage

### PROC-34 -- WarehouseItem catalog
- **Status**: Schema ready, implementation needed
- Prisma `WarehouseItem` model has: name, article, category, quantity, reservedQty, availableQty, minQuantity, unit, location
- Need: CRUD repository, API routes, UI list page with create/edit, search by name/article

### PROC-35 -- Auto-reserve on BOM with isFromWarehouse=true
- **Status**: Schema ready, integration needed
- `BOMItem.isFromWarehouse` boolean already exists
- When creating a BOMItem with `isFromWarehouse=true`, system must:
  1. Create `WarehouseTransaction(type=reserve, quantity, bomItemId)`
  2. Decrease `WarehouseItem.availableQty`
- This is an integration requirement with S02 (BOM) -- safe to stub for now

### PROC-36 -- Stock-in on delivery
- **Status**: Schema ready, integration with S07 needed
- When Delivery status moves to `delivered`: create `WarehouseTransaction(type=in)`, increase quantity + availableQty
- This is the primary integration point between S06 and S07

### PROC-37 -- Stock-out on production issue
- **Status**: Schema ready, integration needed
- When issuing to production: create `WarehouseTransaction(type=out)`, decrease quantity + reservedQty
- Integration with Production module (M004)

### PROC-38 -- Inventory correction with audit
- **Status**: Not yet in schema
- Needs a correction operation type (can reuse `WarehouseTransaction` with a `correction` type)
- Audit trail exists via `WarehouseTransaction` already

### PROC-39 -- Min-stock alerts
- **Status**: Schema ready, implementation needed
- `WarehouseItem.minQuantity` exists alongside `quantity`
- Need: alert/notification when `quantity < minQuantity`
- Can use existing `Notification` model from schema

### PROC-40 -- Turnover report
- **Status**: Should-have, defer to future slice
- Requires aggregating `WarehouseTransaction` by date range
- Not needed for first proof

---

## Existing Code Audit

### What EXISTS (already in the codebase):

| Artifact | Path | Notes |
|---|---|---|
| Prisma `WarehouseItem` model | `apps/web/prisma/schema.prisma:1012-1029` | Complete: name, article, category, quantity, reservedQty, availableQty, minQuantity, unit, location |
| Prisma `WarehouseTransaction` model | `apps/web/prisma/schema.prisma:1031-1043` | Complete: warehouseItemId, bomItemId (optional), type, quantity, notes |
| Requirements doc | `docs/10-module-procurement.md` | Sections 10.2.5 (PROC-34 to PROC-40), 10.4.4 (UI), 10.5 (API endpoints) |
| Repository pattern | `apps/web/src/lib/db/deals.ts` | Class-based, singleton, findMany/findUnique/create/update/softDelete/count |
| Repository pattern (multi-entity) | `apps/web/src/lib/db/production.ts` | Same pattern + sub-resource methods for ProductionStage |
| Prisma client singleton | `apps/web/src/lib/db/prisma.ts` | Global singleton with dev logging |
| API client pattern | `apps/web/src/lib/api/deals.ts` | Class-based with configurable fetch/baseUrl, singleton + convenience exports |
| API route pattern | `apps/web/src/app/api/deals/route.ts` | Next.js App Router, try/catch, { data, count } response |
| API route sub-resource | `apps/web/src/app/api/deals/[id]/move/route.ts` | POST with validation, error handling |
| UI components (shadcn) | `apps/web/src/components/ui/` | Table, Badge, Button, Card, Dialog, Select, Input |
| Feature components | `apps/web/src/components/deals/`, `apps/web/src/components/projects/` | Modal, Table, Kanban, Gantt patterns |
| Page pattern | `apps/web/src/app/projects/page.tsx` | use client, fetch in useEffect, Table + Badge |
| Shared API utilities | `apps/web/src/lib/api/shared.ts` | ApiClientError, parseApiError, parseJson |
| Shared API types | `apps/web/src/lib/api/types.ts` | ApiResponse<T>, ApiListResponse<T>, PaginationOptions, ApiClientConfig |

### What DOES NOT EXIST (must be created):

| Missing Artifact | Priority |
|---|---|
| `apps/web/src/lib/db/warehouse.ts` -- WarehouseRepository | MUST |
| `apps/web/src/lib/api/warehouse.ts` -- WarehouseApiClient | MUST |
| `apps/web/src/lib/api/types.ts` -- Warehouse types (add to existing) | MUST |
| `apps/web/src/app/api/warehouse-items/route.ts` -- GET, POST | MUST |
| `apps/web/src/app/api/warehouse-items/[id]/route.ts` -- GET, PATCH, DELETE | MUST |
| `apps/web/src/app/api/warehouse-items/[id]/transaction/route.ts` -- POST transaction | MUST |
| `apps/web/src/app/warehouse/page.tsx` -- List page | MUST |
| `apps/web/src/components/warehouse/warehouse-table.tsx` | MUST |
| `apps/web/src/components/warehouse/warehouse-operation-modal.tsx` | MUST |
| `apps/web/src/components/warehouse/warehouse-create-modal.tsx` | MUST |
| `apps/web/src/lib/db/warehouse.test.ts` -- Repository tests | MUST |
| `apps/web/src/lib/api/warehouse.test.ts` -- API client tests | SHOULD |

---

## Implementation Landscape

### File Creation Plan

```
# Layer 1: Repository (data access)
apps/web/src/lib/db/warehouse.ts          -- WarehouseRepository
apps/web/src/lib/db/warehouse.test.ts      -- tests

# Layer 2: API Routes (server endpoints)
apps/web/src/app/api/warehouse-items/route.ts
apps/web/src/app/api/warehouse-items/[id]/route.ts
apps/web/src/app/api/warehouse-items/[id]/transaction/route.ts

# Layer 3: API Client (browser-side HTTP client)
apps/web/src/lib/api/warehouse.ts
apps/web/src/lib/api/warehouse.test.ts

# Layer 4: UI Pages
apps/web/src/app/warehouse/page.tsx         -- Warehouse list page
apps/web/src/app/warehouse/layout.tsx       -- (optional, if needed)

# Layer 5: UI Components
apps/web/src/components/warehouse/warehouse-table.tsx
apps/web/src/components/warehouse/warehouse-operation-modal.tsx
apps/web/src/components/warehouse/warehouse-create-modal.tsx

# Layer 6: Types (append to existing)
apps/web/src/lib/api/types.ts               -- Add WarehouseData, etc.
```

### Natural Seams (Task Grouping)

**Task 1: Repository + Schema types** (~25 min)
- Create `apps/web/src/lib/db/warehouse.ts` with `WarehouseRepository` class
- Methods: findMany (with search by name/article/category), findUnique, create, update, softDelete, getTransactions
- Add transaction methods: createTransaction(type, quantity, bomItemId?), getTransactions(warehouseItemId)
- Add business logic methods: processStockIn, processStockOut, processReserve, processInventoryCorrection
- These business methods should atomically update both the WarehouseItem and create the WarehouseTransaction

**Task 2: API routes** (~25 min)
- `GET /api/warehouse-items` -- list with search/filter (name, article, category), color-coded stock level field
- `POST /api/warehouse-items` -- create new warehouse item
- `GET /api/warehouse-items/[id]` -- single item with transaction history
- `PATCH /api/warehouse-items/[id]` -- update item fields
- `DELETE /api/warehouse-items/[id]` -- soft delete
- `POST /api/warehouse-items/[id]/transaction` -- execute operation { type, quantity, bomItemId?, notes }

**Task 3: API client** (~15 min)
- `apps/web/src/lib/api/warehouse.ts` following the DealApiClient pattern
- Methods: getWarehouseItems, getWarehouseItem, createWarehouseItem, updateWarehouseItem, deleteWarehouseItem, createTransaction

**Task 4: UI -- List page with table** (~30 min)
- `apps/web/src/app/warehouse/page.tsx` -- use client, fetch + display
- `apps/web/src/components/warehouse/warehouse-table.tsx`
- Color-coded stock levels: green (quantity > minQuantity), yellow (quantity == minQuantity), red (quantity < minQuantity)
- Columns: Name, Article, Category, Quantity, Available, Reserved, Min Qty, Location, Actions

**Task 5: UI -- Operation modals** (~25 min)
- `apps/web/src/components/warehouse/warehouse-operation-modal.tsx`
  - Fields: operation type (in/out/reserve/correction), quantity, notes
  - Shows current stock levels before/after
  - Validation: stock-out/reserve cannot exceed availableQty
- `apps/web/src/components/warehouse/warehouse-create-modal.tsx`
  - Fields: name, article, category, quantity, minQuantity, unit, location

**Task 6: Tests + Integration stubs** (~20 min)
- Repository tests: CRUD, transactions, stock math, min-stock detection
- API client smoke tests
- Stub integration points: S02 (BOM reserve), S07 (Delivery stock-in)

---

## First Proof

**Highest risk item**: The transaction business logic (stock-in, stock-out, reserve, correction) and the atomic update of both `WarehouseItem.quantity/reservedQty/availableQty` and `WarehouseTransaction` creation.

**Recommended first task**: Build the `WarehouseRepository` with transaction methods first. This is the foundation everything else depends on. The core logic is:
- `processStockIn(itemId, quantity, notes)`: `quantity += qty`, `availableQty += qty`, create tx type=in
- `processStockOut(itemId, quantity, notes)`: `quantity -= qty`, `reservedQty -= qty`, create tx type=out
- `processReserve(itemId, quantity, notes)`: `availableQty -= qty`, `reservedQty += qty`, create tx type=reserve
- `processCorrection(itemId, newQuantity, notes)`: set quantity to exact value, recalculate availableQty, create tx type=correction

**Edge cases to handle**:
- Stock-out when quantity < requested qty: throw / reject
- Reserve when availableQty < requested qty: throw / reject
- Concurrent operations: SQLite transactions via `prisma.$transaction([])`
- availableQty should never go negative

These methods should use Prisma's `$transaction` to ensure atomicity of the item update + transaction creation.

---

## Verification

### Test commands:
```bash
# Run repository tests
cd apps/web && npx vitest run src/lib/db/warehouse.test.ts

# Run API client tests
cd apps/web && npx vitest run src/lib/api/warehouse.test.ts

# Type-check
cd apps/web && npx tsc --noEmit

# Dev server smoke test
cd apps/web && npm run dev
# Then manually test:
# GET /api/warehouse-items
# POST /api/warehouse-items { name: "Test Item", quantity: 100, minQuantity: 10 }
# POST /api/warehouse-items/{id}/transaction { type: "out", quantity: 5 }
```

### Verification checklist:
- [ ] All CRUD operations on WarehouseItem work via API
- [ ] Stock-in increases quantity and availableQty
- [ ] Stock-out decreases quantity and reservedQty
- [ ] Reserve decreases availableQty and increases reservedQty
- [ ] Stock-out when quantity < requested fails gracefully
- [ ] Reserve when availableQty < requested fails gracefully
- [ ] Inventory correction sets exact quantity
- [ ] Each operation creates a WarehouseTransaction audit record
- [ ] List page shows color-coded stock levels (green/yellow/red)
- [ ] Search by name and article works
- [ ] Min-stock alert triggers when quantity < minQuantity

---

## Recommendation

### Task decomposition for the planner:

1. **T01: WarehouseRepository** (25 min) -- Core data access with transaction business logic
2. **T02: Warehouse API Routes** (25 min) -- REST endpoints including transaction sub-resource
3. **T03: Warehouse API Client** (15 min) -- Browser-side HTTP client
4. **T04: Warehouse List Page** (30 min) -- UI page with color-coded table
5. **T05: Warehouse Operation Modals** (25 min) -- In/Out/Reserve/Correction dialogs
6. **T06: Tests + Integration Stubs** (20 min) -- Test coverage, S02/S07 integration stubs

**Execution order**: T01 -> T02 -> T03 -> T04 -> T05 -> T06

**Parallelization notes**:
- T01 and T02 are inherently sequential (routes depend on repository)
- T03 and T04 can be done in parallel after T02
- T05 depends on T04 (shares components)
- T06 is last (depends on everything)

**Key architectural decisions to make**:
1. Stock level status (green/yellow/red) -- computed in repository or in API route? Recommendation: computed field in API route response for flexibility
2. Notification for min-stock -- use existing `Notification` model or an inline visual cue in the UI table? Recommendation: both -- UI color-coding is immediate, Notification is async
3. Transaction ID generation -- UUID as per existing pattern
4. `availableQty` is stored as a computed column -- ensure consistency by always updating it atomically alongside quantity and reservedQty
