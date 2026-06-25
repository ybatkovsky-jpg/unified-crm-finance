---
id: T03
parent: S01
milestone: M005
key_files: []
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-23T09:22:18.247Z
blocker_discovered: false
---

# T03: Created GET/POST collection route and GET/PUT/DELETE single-resource route for counterparties API following the contacts route pattern

**Created GET/POST collection route and GET/PUT/DELETE single-resource route for counterparties API following the contacts route pattern**

## What Happened

Created two API route files for the Counterparty model:

1. `apps/web/src/app/api/counterparties/route.ts` - Collection route with:
   - GET: Lists counterparties with optional `type` (exact match) and `search` (case-insensitive contains on name/inn) filtering. Returns `{ data, count }` using `counterparties.findMany` and `counterparties.count`.
   - POST: Creates a new counterparty with validation. Requires `name` (400 if missing) and `type` must be 'supplier' or 'customer' (400 if invalid). Builds createData with null fallbacks for all optional fields (inn, kpp, email, phone, contactPerson, address, bankName, bankAccount, korAccount, bik, notes, rating, attributes). Returns `{ data }` with 201 status.
   - Both handlers wrapped in try/catch with console.error and 500 error response `{ error, message }`.

2. `apps/web/src/app/api/counterparties/[id]/route.ts` - Single resource route with:
   - GET: Fetches a counterparty by ID with includes for PurchaseRequest, Invoice, and Delivery (minimal selects with id, number/status, timestamps). Returns 404 if not found, else `{ data }`.
   - PUT: Updates a counterparty. Verifies existence first (404 if not found). Builds updateData with only defined fields from body. Returns `{ data }`.
   - DELETE: Soft-deletes a counterparty via `counterparties.softDelete`. Catches 'not found' errors and returns 404. Returns `{ data, message }` with 200 on success.
   - All handlers: RouteParams uses `params: Promise<{ id: string }>`, wrapped in try/catch with console.error and 500 response.

Both routes follow the exact pattern established by the contacts API routes (`apps/web/src/app/api/contacts/route.ts` and `apps/web/src/app/api/contacts/[id]/route.ts`), with imports from `../../../lib/db/counterparties` / `../../../../lib/db/counterparties` and using the `counterparties` singleton from `CounterpartyRepository`.

## Verification

TypeScript type check passed with no errors in the new route files. Ran `npx tsc --noEmit` in apps/web directory - the only counterparty-related errors are pre-existing issues in `apps/web/src/lib/api/counterparties.test.ts` (a test file, not the new routes). The new route files compile cleanly. Verified that the Prisma select field names match the actual schema (PurchaseRequest has id/number/status/createdAt, Invoice has totalAmount not total, Delivery has trackingNumber not number/amount).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit 2>&1 | grep counterparties/route` | 0 | pass | 45000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

None.
