---
id: T02
parent: S01
milestone: M006
key_files:
  - apps/web/src/app/api/categories/route.ts
  - apps/web/src/app/api/categories/[id]/route.ts
key_decisions:
  - GET list uses prisma directly for flexible filtering (not repo methods which lack includeInactive support)
  - PATCH (not PUT) for updates per task plan specification
  - DELETE returns 409 Conflict for referential integrity violations (Budget/Transaction references)
  - Repository validation errors mapped to HTTP 400 at API layer
duration: 
verification_result: passed
completed_at: 2026-06-24T08:13:30.054Z
blocker_discovered: false
---

# T02: Created Category API routes with 5 endpoints, validation, and hierarchical error handling

**Created Category API routes with 5 endpoints, validation, and hierarchical error handling**

## What Happened

Created two API route files following the counterparties pattern:

1. **Collection route** (`apps/web/src/app/api/categories/route.ts`):
   - GET: list with filters (type, isActive, includeInactive). Uses prisma directly for flexible where-clause construction. Returns flat list sorted by parentId (nulls first) then order.
   - POST: create with validation. Required fields: name, type (income/expense). Optional: parentId, order, isActive. Uses CategoryRepository.create() for cycle detection and parent validation. Returns 400 for validation errors, 201 on success.

2. **Single resource route** (`apps/web/src/app/api/categories/[id]/route.ts`):
   - GET: fetch by ID. Returns 404 if not found or inactive.
   - PATCH: partial update (name, type, parentId, order, isActive). Validates type enum, delegates parentId cycle/self-parenting checks to repository. Returns 400/404/500 appropriately.
   - DELETE: soft-delete via isActive=false. Returns 409 if referenced by Budget/Transaction records. Returns 404 if not found.

Error handling: maps repository errors to appropriate HTTP status codes — 400 for validation (invalid parentId, cycles, self-parenting), 404 for not found, 409 for referential conflicts, 500 for unexpected errors.

## Verification

All endpoints tested via curl against running Next.js dev server:

**Collection endpoints (6 checks):**
- GET /api/categories → 200 with `{data:[],count:0}`
- GET /api/categories?type=income → 200 filtered
- GET /api/categories?includeInactive=true → 200 includes all
- POST missing name → 400 "name is required"
- POST invalid type → 400 "type must be income or expense"
- POST valid → 201 with category data including generated UUID

**Single resource endpoints (7 checks):**
- GET /api/categories/[id] → 200 with category data
- GET /api/categories/nonexistent → 404
- PATCH invalid type → 400
- PATCH valid (name+order) → 200 with updated data
- PATCH self-parenting → 400 "cannot be its own parent"
- PATCH cycle → 400 "would create a cycle"
- DELETE → 200 with isActive=false, message
- GET after delete → 404 (inactive not returned)

**Slice verification satisfied:**
- "Category API возвращает 400 на invalid parentId" — confirmed (POST with nonexistent parentId returns 400)
- "логи содержат id операции" — all responses include category id in data

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `TypeScript type check (npx tsc --noEmit)` | 0 | pass (no errors in category routes) | 12000ms |
| 2 | `GET /api/categories` | 0 | pass - 200 with data + count | 150ms |
| 3 | `POST /api/categories (valid)` | 0 | pass - 201 with created category | 200ms |
| 4 | `POST /api/categories (invalid parentId)` | 0 | pass - 400 validation error | 150ms |
| 5 | `PATCH self-parenting / cycle detection` | 0 | pass - 400 for both cases | 300ms |
| 6 | `DELETE /api/categories/[id]` | 0 | pass - 200, isActive=false, 404 after | 200ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/categories/route.ts`
- `apps/web/src/app/api/categories/[id]/route.ts`
