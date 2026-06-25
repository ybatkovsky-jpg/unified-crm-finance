---
estimated_steps: 12
estimated_files: 2
skills_used: []
---

# T03: Create API routes for counterparties collection and single resource

Why: API routes are the HTTP contract that UI pages consume. Must follow the exact contacts route pattern (Next.js App Router, error shape, status codes).

Do:
1. Create `src/app/api/counterparties/route.ts`:
   - GET: parse type and search from query params, build Prisma where clause (type exact match, search matches name OR inn via contains), call counterparties.findMany with orderBy createdAt desc, return { data, count }
   - POST: validate body.name is required (400 if missing), validate body.type is 'supplier' or 'customer' (400 if invalid), build createData with all fields (null fallbacks for optionals), call counterparties.create, return { data } with 201
2. Create `src/app/api/counterparties/[id]/route.ts`:
   - GET: await params.id, validate non-empty, call counterparties.findUnique with include (PurchaseRequest, Invoice, Delivery — minimal selects), return 404 if null, else { data }
   - PUT: await params.id, validate non-empty, verify exists (404 if not), build updateData from body (only defined fields), call counterparties.update, return { data }
   - DELETE: await params.id, validate non-empty, call counterparties.softDelete, catch 'not found' error → 404, else return { data, message } with 200
   - All handlers wrap in try/catch with console.error and 500 { error, message } response
   - RouteParams uses `params: Promise<{ id: string }>` pattern (Next.js 15 async params)

Done when: TypeScript compiles, API routes respond correctly to curl smoke tests (create supplier → get list → get by id → update → soft delete → verify 404).

## Inputs

- `apps/web/src/lib/db/counterparties.ts`
- `apps/web/src/app/api/contacts/route.ts`
- `apps/web/src/app/api/contacts/[id]/route.ts`

## Expected Output

- `apps/web/src/app/api/counterparties/route.ts`
- `apps/web/src/app/api/counterparties/[id]/route.ts`

## Verification

npx tsc --noEmit

## Observability Impact

All route handlers log errors via console.error with error.message. Not-found responses include the entity ID in the message. Validation errors include specific field names in messages.
