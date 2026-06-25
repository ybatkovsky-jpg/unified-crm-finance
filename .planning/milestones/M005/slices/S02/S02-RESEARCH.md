# S02: Спецификация (BOM) — Research

**Date:** 2026-06-23
**Risk:** high
**Depends on:** S01 (Counterparty CRUD)
**Researcher:** scout agent

## Summary

S02 delivers the Bill of Materials (BOM) management surface for procurement. Users upload Excel specifications into a project, the system parses rows into structured BOMItem records, and users can edit items, assign suppliers, and lock the specification. The full AI parsing pipeline (Python worker) is deferred to a later enhancement — S02 focuses on client-side Excel parsing with SheetJS and manual editing UX.

## Recommendation

**Build client-side Excel parsing first.** Use the `xlsx` (SheetJS) npm package (~120KB gzipped, zero native deps) to parse Excel files in the browser. Extract rows, attempt basic column mapping by header matching, and present parsed data in an editable table. Upload the parsed BOM structure to the API. Defer Python-worker AI parsing to a follow-up (the worker currently has no webhook endpoints or Excel processing logic).

**Follow the established 5-layer pattern:** BOMRepository → BOMApiClient → API Routes → UI Pages → Components. This is exactly the pattern proven in S01 (Counterparty) and earlier milestones.

**Place BOM UI on the project detail page** as a new tab/section (alongside Stages, Production, Files). The BOM is project-scoped (`BOM.projectId` is unique), so this keeps the mental model clean. An alternative is a separate page at `/projects/[id]/bom`, but a tabbed section on the existing project detail page is simpler and matches the existing Production integration pattern.

## Implementation Landscape

### Files to create (all new — zero existing BOM code)

| Layer | File | Purpose |
|-------|------|---------|
| Repository | `apps/web/src/lib/db/bom.ts` | BOMRepository + BOMItemRepository |
| Repository tests | `apps/web/src/lib/db/bom.test.ts` | Unit tests for CRUD + lock/unlock |
| API Client | `apps/web/src/lib/api/bom.ts` | BOMApiClient with typed methods |
| API Client tests | `apps/web/src/lib/api/bom.test.ts` | API client tests |
| API Types | `apps/web/src/lib/api/types.ts` | Add BOMData, BOMItemData, BOMCreateInput, etc. |
| API Route (collection) | `apps/web/src/app/api/bom/route.ts` | GET (by projectId), POST (create with items) |
| API Route (single) | `apps/web/src/app/api/bom/[id]/route.ts` | GET, PUT, DELETE |
| API Route (items) | `apps/web/src/app/api/bom/[id]/items/route.ts` | GET items, POST add items |
| API Route (item) | `apps/web/src/app/api/bom/items/[id]/route.ts` | GET, PUT, DELETE single item |
| API Route (lock) | `apps/web/src/app/api/bom/[id]/lock/route.ts` | POST lock, POST unlock |
| UI — BOM Section | `apps/web/src/components/procurement/bom-section.tsx` | BOM tab content: upload, table, lock |
| UI — BOM Table | `apps/web/src/components/procurement/bom-table.tsx` | Editable table of BOM items |
| UI — Excel Upload | `apps/web/src/components/procurement/bom-excel-upload.tsx` | Excel file dropzone + preview |
| UI — BOM Item Form | `apps/web/src/components/procurement/bom-item-form.tsx` | Dialog for editing single BOM item |
| Project page update | `apps/web/src/app/projects/[id]/page.tsx` | Add BOM tab to existing page |

### Files to reference (existing — do not modify unless needed)

| File | Why |
|------|-----|
| `apps/web/prisma/schema.prisma` | BOM (lines 59-72), BOMItem (lines 74-99) models |
| `apps/web/src/lib/db/counterparties.ts` | Repository pattern to mirror |
| `apps/web/src/lib/api/counterparties.ts` | API client pattern to mirror |
| `apps/web/src/lib/db/files.ts` | FileRepository — already handles uploads |
| `apps/web/src/lib/api/files.ts` | FilesApiClient — already has uploadFile |
| `apps/web/src/components/shared/file-upload.tsx` | Reusable file upload component |
| `apps/web/src/components/ui/tabs.tsx` | Custom Tabs component (value/onValueChange pattern) |
| `apps/web/src/app/projects/[id]/page.tsx` | Where BOM tab gets added |

### New npm dependency

```
npm install xlsx
```

`xlsx` (SheetJS Community Edition) — MIT licensed, pure JS, parses `.xlsx` and `.xls`. We only need the read-side (`XLSX.read` + `XLSX.utils.sheet_to_json`). Bundle impact: ~120KB gzipped.

### Prisma Schema — Relevant Models

```prisma
model BOM {
  id           String      @id
  projectId    String      @unique          // 1 BOM per project
  sourceFileId String?     @unique          // The uploaded Excel file
  status       String      @default("draft") // draft | locked
  version      Int         @default(1)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime
  FileEntity   FileEntity? @relation(fields: [sourceFileId], references: [id])
  Project      Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  BOMItem      BOMItem[]
}

model BOMItem {
  id              String                 @id
  bomId           String
  rowNumber       Int                    // Original Excel row number
  name            String                 // Item name
  article         String?                // Article/code
  category        String?                // Category
  quantity        Float
  unit            String                 @default("шт")
  price           Float                  @default(0)
  supplierId      String?                // Linked Counterparty
  status          String                 @default("pending") // pending | ordered | received
  isFromWarehouse Boolean                @default(false)
  notes           String?
  Counterparty    Counterparty?          @relation(fields: [supplierId], references: [id])
  BOM             BOM                    @relation(fields: [bomId], references: [id], onDelete: Cascade)
  // Relations used by downstream slices:
  InvoiceItem          InvoiceItem[]
  PurchaseRequestItem  PurchaseRequestItem[]
  WarehouseTransaction WarehouseTransaction[]
}
```

### API Route Design

Following the established App Router pattern:

```
GET    /api/bom?projectId=<id>       → Get BOM for project (with items)
POST   /api/bom                       → Create BOM (with optional items array)
GET    /api/bom/[id]                  → Get single BOM with items
PUT    /api/bom/[id]                  → Update BOM metadata
DELETE /api/bom/[id]                  → Soft-delete BOM
GET    /api/bom/[id]/items            → List BOM items
POST   /api/bom/[id]/items            → Add items to BOM
GET    /api/bom/items/[id]            → Get single item
PUT    /api/bom/items/[id]            → Update item (name, qty, price, supplier)
DELETE /api/bom/items/[id]            → Remove item
POST   /api/bom/[id]/lock             → Lock BOM (status → "locked")
POST   /api/bom/[id]/unlock           → Unlock BOM (status → "draft")
```

### Excel Parsing Strategy (Client-Side)

1. User clicks "Upload Excel" → FileUpload component accepts `.xlsx`, `.xls`
2. File is uploaded to MinIO/S3 via existing `/api/files` → gets FileEntity record
3. File data is also read client-side with `XLSX.read(arrayBuffer)`
4. `XLSX.utils.sheet_to_json(sheet, { header: 1 })` extracts row arrays
5. First row analyzed for column headers — match against known patterns:
   - Name: `наименование`, `name`, `позиция`, `item`
   - Quantity: `количество`, `кол-во`, `qty`, `quantity`
   - Unit: `ед`, `ед.изм`, `unit`, `measure`
   - Price: `цена`, `price`, `стоимость`
   - Article: `артикул`, `article`, `код`
6. Matched rows become `BOMItemCreateInput[]` with `rowNumber = excelRowIndex`
7. User reviews parsed data in preview table before confirming
8. On confirm: POST `/api/bom` with `{ projectId, sourceFileId, items: [...] }`

### Supplier Assignment Flow

- BOMItem table has a supplier column with a Select dropdown
- Dropdown fetches from `GET /api/counterparties?type=supplier` (S01 already provides this)
- Uses Counterparty name + INN for display
- Can bulk-assign: select multiple rows → pick supplier

### Lock/Unlock

- Lock sets `BOM.status = "locked"` → UI disables all edit controls
- Unlock sets `BOM.status = "draft"` → re-enables editing
- Lock required before creating PurchaseRequests (S03 concern, just API here)

### Python Worker — AI Parsing (Deferred)

The M005-CONTEXT.md describes AI parsing via Python worker webhook, but the worker currently has only:
- Health check endpoint
- RabbitMQ consumer for notifications queue
- Database connection management

There are no AI/webhook endpoints, no Excel processing logic, no callback mechanism. Building the full AI pipeline would require:
1. New FastAPI endpoint (`POST /webhook/parse-bom`)
2. Excel processing with pandas
3. LLM integration for fuzzy name matching
4. Callback to Next.js API to update BOM items
5. Error handling and retry logic

**Decision:** S02 does client-side Excel parsing for MVP. The worker webhook endpoint is a follow-up task in a later slice or separate milestone. The client-side parsing covers 80% of the value (structured Excel → BOM items) without the infrastructure complexity.

### Risk: AI Parsing Quality

The roadmap marks this slice as `risk:high` due to AI parsing uncertainty. Mitigation:
- Client-side parsing handles well-structured Excel files (header-based column mapping)
- Manual editing UI allows correction of any parsing errors
- Supplier assignment is manual (dropdown from counterparty list)
- The `notes` field on BOMItem captures any parsing issues
- Future AI enhancement can be added without changing the data model or API

### BOM Versioning (PROC-09 — Should, deferred)

BOM versioning (`BOM.version` field exists in schema) is a Should requirement. For S02 MVP:
- Always version 1
- No version history UI
- The field exists for future use

## Natural Seams (for task decomposition)

1. **BOMRepository + tests** — Independent of UI. Needs only Prisma schema.
2. **BOMApiClient + types + tests** — Independent of routes. Needs repository types.
3. **API Routes** — Depends on Repository. Independent of UI.
4. **BOM Excel Upload component** — Depends on file upload pattern. Can be built standalone.
5. **BOM Table component** — Editable table with inline edit. Needs API client for testing.
6. **BOM Section on project page** — Integration of upload + table + lock.
7. **Supplier assignment UX** — Dropdown integration with Counterparty API (S01).

## First Proof

The highest-risk item is Excel parsing quality. Build **T04 (BOM Excel Upload)** first as a tracer bullet:
- Install `xlsx`, create the upload component
- Parse a real Excel file → show parsed rows in preview
- Verify column mapping works for common Excel formats
- This derisks the core value prop before building the full CRUD layer

Alternative: Build T01 (Repository) first since it's the foundation and has no external dependencies.

## Verification

| Step | Command | What it proves |
|------|---------|----------------|
| Repository tests | `npx tsx --test src/lib/db/bom.test.ts` | CRUD + lock/unlock work correctly |
| API client tests | `npx tsx --test src/lib/api/bom.test.ts` | API client methods + error handling |
| TypeScript check | `npx tsc --noEmit` (grep for bom/) | No type errors in new files |
| Manual: Excel upload | Upload `.xlsx` in browser → see parsed rows | Excel parsing works |
| Manual: Edit + lock | Edit items in table → lock → verify disabled | Full user flow |

## Constraints

- **Prisma 6.6.0** locked — no 7.x features
- **SQLite** in dev — no PostgreSQL-specific features (no `enum`, no array columns)
- **BOM.id requires manual UUID** via `randomUUID()` — same pattern as all other models
- **BOM.updatedAt must be set manually** on updates — Prisma SQLite adapter doesn't support `@updatedAt`
- **BOM.projectId is `@unique`** — exactly one BOM per project, enforced at DB level
- **File upload already works** — reuse FileRepository/FilesApiClient, don't reinvent
- **Counterparty list requires S01 completion** — supplier dropdown depends on S01 API being live

## Don't Hand-Roll

- **Excel parsing** → Use `xlsx` (SheetJS), don't write custom XLSX parser
- **File upload** → Reuse existing FileUpload component + `/api/files` route
- **Tabs** → Reuse existing custom Tabs component (`@/components/ui/tabs`)
- **Select dropdown** → Base UI Select from shadcn/ui (already in project)
- **Table UI** → shadcn/ui Table or build simple table with Tailwind (project uses both patterns)

## Sources

- `apps/web/prisma/schema.prisma` — BOM and BOMItem models (lines 59-99)
- `docs/10-module-procurement.md` — PROC-01 through PROC-10 requirements
- `apps/web/src/lib/db/counterparties.ts` — Repository pattern reference
- `apps/web/src/lib/api/counterparties.ts` — API client pattern reference
- `apps/web/src/lib/storage/s3.ts` — File storage utilities
- `apps/web/src/components/shared/file-upload.tsx` — Reusable upload component
- `apps/web/src/components/ui/tabs.tsx` — Custom Tabs component
- `apps/web/src/app/projects/[id]/page.tsx` — Project detail page (BOM integration target)
- `apps/worker/app/main.py` — Python worker (skeleton — no AI endpoints yet)
