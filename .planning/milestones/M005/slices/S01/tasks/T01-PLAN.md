---
estimated_steps: 25
estimated_files: 2
skills_used: []
---

# T01: Create CounterpartyRepository with tests

Why: Repository is the data-access foundation. Must follow the exact ContactRepository pattern (singleton, soft-delete filtering, UUID generation, manual updatedAt).

Do:
1. Create `src/lib/db/counterparties.ts` with CounterpartyRepository class:
   - findMany(params?) — auto-filters deletedAt: null, supports where/orderBy/skip/take/include
   - findUnique(id, include?) — returns null if soft-deleted or missing
   - findByInn(inn) — dedup check, excludes soft-deleted
   - findByType(type) — filtered list by type field
   - create(data) — randomUUID() for id, new Date() for updatedAt
   - update(id, data) — verify exists (not soft-deleted), then Prisma update
   - softDelete(id) — verify exists, set deletedAt = new Date()
   - count(where?) — excludes soft-deleted
   - existsByInn(inn) — boolean check
   - Singleton export: `export const counterparties = new CounterpartyRepository()`
2. Create `src/lib/db/counterparties.test.ts` using node:test:
   - create → verify id generated, fields match
   - findUnique → returns created record
   - findByInn → returns match, returns null for nonexistent
   - findByType → returns only matching type
   - findMany → excludes soft-deleted records
   - update → field changes persisted, throws for soft-deleted
   - softDelete → deletedAt set, findUnique returns null, record still in DB
   - count → returns number >= 0
   - existsByInn → true/false
   - cleanup: hard-delete test records, disconnect Prisma

Done when: `npx tsx --test src/lib/db/counterparties.test.ts` passes all tests.

## Inputs

- `apps/web/src/lib/db/prisma.ts`
- `apps/web/src/lib/db/contacts.ts`
- `apps/web/prisma/schema.prisma`
- `apps/web/src/lib/db/contacts.test.ts`

## Expected Output

- `apps/web/src/lib/db/counterparties.ts`
- `apps/web/src/lib/db/counterparties.test.ts`

## Verification

npx tsx --test src/lib/db/counterparties.test.ts

## Observability Impact

Repository throws descriptive errors for not-found and already-deleted cases. Soft-delete filtering is automatic in findMany/findUnique — no caller can accidentally expose deleted records.
