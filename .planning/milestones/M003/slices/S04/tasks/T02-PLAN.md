---
estimated_steps: 19
estimated_files: 1
skills_used: []
---

# T02: Add ContractRepository unit tests (14 methods)

## Why
ContractRepository has zero test coverage. Following S01/M002 pattern, comprehensive unit tests verify each method works correctly with real Prisma.

## Do
Write apps/web/src/lib/db/contracts.test.ts with node:test covering:
- findMany: filtering by status, contactId, dealId, soft-delete exclusion
- findUnique: with/without includes, null for missing/deleted
- findByContact: delegate to findMany
- findByDeal: single result or null
- create: UUID generation, Д-YYYY-NNNNN number format, timestamps
- update: valid fields, throws for missing/deleted
- softDelete: sets deletedAt, excluded from queries
- count: with/without filters
- addVersion: auto-increments version number (MAX+1)
- getVersions: ordered by version desc
- addSigner: creates signer with name, optional position
- getSigners: ordered by id asc
- convertFromDeal: creates contract with bidirectional link, throws if exists, throws if deal not found

## Done when
- cd apps/web && npx tsx --test src/lib/db/contracts.test.ts passes with 0 failures

## Inputs

- `apps/web/src/lib/db/contracts.ts`
- `apps/web/prisma/schema.prisma`

## Expected Output

- `apps/web/src/lib/db/contracts.test.ts`

## Verification

cd apps/web && npx tsx --test src/lib/db/contracts.test.ts

## Observability Impact

Test assertion errors provide descriptive failure messages — no runtime observability changes
