# S04 Research: Contract Repository, API, and Deal Conversion

## Overview

Slice S04 covers the Contract module: repository, API routes, API client, and the Deal-to-Contract conversion flow. The code was pre-built as part of the initial scaffolding, so this research focuses on identifying gaps, risks, inconsistencies, and the test surface needed before execution.

---

## Existing Files and Structure

### Repository Layer

**`apps/web/src/lib/db/contracts.ts`** (290 lines) — `ContractRepository` class with 14 methods:

| Method | Purpose | Notes |
|--------|---------|-------|
| `findMany` | List with optional filters | Auto-excludes soft-deleted |
| `findUnique` | Single by ID | Uses `findFirst` with `deletedAt: null` |
| `findByContact` | By contact | Delegates to `findMany` |
| `findByDeal` | By deal | Single result (dealId is unique) |
| `create` | Create contract | UUID + auto-number + timestamps |
| `update` | Update fields | Throws if not found/deleted |
| `softDelete` | Set deletedAt | Throws if not found |
| `count` | Count with filters | Excludes soft-deleted |
| `addVersion` | Add ContractVersion | Auto-increments version number |
| `getVersions` | List all versions | Ordered by version desc |
| `addSigner` | Add ContractSigner | Name + optional position + signatureFileId |
| `getSigners` | List all signers | Ordered by id asc |
| `convertFromDeal` | Deal -> Contract | Creates contract, links back to deal |

### API Routes

| File | Methods | Import Style |
|------|---------|-------------|
| `apps/web/src/app/api/contracts/route.ts` | GET, POST | Relative import (`../../../lib/db/contracts`) |
| `apps/web/src/app/api/contracts/[id]/route.ts` | GET, PATCH, DELETE | `@/lib/db/contracts` |
| `apps/web/src/app/api/contracts/[id]/versions/route.ts` | GET, POST | `@/lib/db/contracts` |
| `apps/web/src/app/api/contracts/[id]/signers/route.ts` | GET, POST | `@/lib/db/contracts` |
| `apps/web/src/app/api/deals/[id]/convert/route.ts` | POST | `@/lib/db/contracts` + `@/lib/db/prisma` |

### API Client

**`apps/web/src/lib/api/contracts.ts`** (179 lines) — `ContractApiClient` class with methods:
- `getContracts`, `getContract`, `createContract`, `updateContract`, `deleteContract`
- `getVersions`, `addVersion`
- `getSigners`, `addSigner`
- `convertDeal`

Singleton instance `contractsApi` with destructured convenience exports.

### Types

**`apps/web/src/lib/api/types.ts`** — Already has contract types:
- `ContractData`, `ContractVersionData`, `ContractSignerData`, `ContractTemplateData`
- `ContractFilters`, `ContractListParams`, `ContractCreateInput`, `ContractUpdateInput`
- `ContractVersionCreateInput`, `ContractSignerCreateInput`
- `DealConvertInput`

### Prisma Schema

Models in `apps/web/prisma/schema.prisma`:

- **`Contract`**: id, number (unique), dealId (unique), contactId, templateId, title, amount, currency, startDate, endDate, signedAt, status, signedFileId, notes, attributes, timestamps, deletedAt (soft-delete). Relations to: FileEntity, ContractTemplate, Contact, ContractSigner[], ContractVersion[].
- **`ContractVersion`**: id, contractId, version (Int), contentMd, generatedPdfFileId, createdBy, createdAt. Relation to FileEntity, Contract. Unique constraint on `[contractId, version]`.
- **`ContractSigner`**: id, contractId, name, position, signedAt, signatureFileId. Relation to Contract (cascade delete).
- **`ContractTemplate`**: id, code (unique), name, description, contentMd, variables, isActive, version, createdBy, timestamps. Relation to Contract[].

**Important**: The `Deal` model has `contractId String? @unique` but does NOT declare a `Contract` relation field. The bidirectional link is managed at the application layer in `convertFromDeal`. This is a schema gap — there is no Prisma-level relation from Deal to Contract, so `include: { contract: true }` would not work on Deal queries.

### Seeds

- `apps/web/prisma/seed.ts` — Creates roles, owner user, lead sources, default pipeline with 8 stages, financial categories. **No contract seed data.**
- `apps/web/prisma/seed-deals.ts` — Creates pipeline + stages only (separate seed script). **No contract seed data.**

---

## Critical Issues Found

### 1. No Transaction Wrapping in `convertFromDeal` (HIGH RISK)

```typescript
// contracts.ts line 243-281
async convertFromDeal(dealId, additionalData) {
  const contract = await this.create({ ... });   // Step 1: create contract
  await prisma.deal.update({ ... });              // Step 2: update deal with contractId
  return contract;
}
```

If Step 2 fails (DB error, constraint violation), Step 1 already created an orphaned contract. The deal won't have `contractId` set, yet a contract exists. **Fix: wrap in `prisma.$transaction()`.**

### 2. Auto-Numbering Prone to Collision (MEDIUM RISK)

```typescript
private generateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `Д-${year}-${random}`;
}
```

`Math.random()` is not cryptographically strong and collisions are possible at scale. The DealRepository has the same pattern. **Fix: use a sequential counter or at minimum UUID-based approach** (though the research notes suggest sequential is preferred for business documents). This is also a general pattern issue across the codebase.

### 3. Missing Schema Relation from Deal -> Contract

The `Deal` model has `contractId String? @unique` but no `@relation` annotation. The bidirectional link exists only at the app layer. This means:
- Cannot use `include: { contract: true }` when querying a deal
- Any deal detail page that needs to show the linked contract must make a separate query via `findByDeal`
- Prisma will not enforce referential integrity at the schema level

### 4. Import Style Inconsistency (LOW)

- `apps/web/src/app/api/contracts/route.ts` uses relative import `'../../../lib/db/contracts'`
- All other contract API routes use `'@/lib/db/contracts'`

Per established convention (MEM010), relative imports should be used to avoid tsc issues. The convert route uses `@/` for both `contracts` and `prisma` imports.

### 5. Hardcoded User IDs in Other Repos

The `changedBy` field in `addVersion` and `addSigner` accepts a `createdBy` parameter, but the Research notes mention `"current-user-id"` is hardcoded elsewhere. The API routes for versions/signers require `createdBy`/`name` from request body, so no hardcoded values in this slice — **but** the caller must provide a real user ID. If auth middleware is not yet wired up, this will fail in production.

### 6. No Test Coverage (GAP)

Zero tests exist for:
- `ContractRepository` (14 methods)
- `ContractApiClient` (11 methods)
- Contract API routes (5 endpoints, 7 HTTP methods)
- Convert endpoint

---

## What Already Works (Can Be Tested As-Is)

- `ContractRepository.findMany` — auto-filters deletedAt: null, supports include
- `ContractRepository.findUnique` — uses findFirst with deletedAt check
- `ContractRepository.create` — generates UUID, number, timestamps
- `ContractRepository.update` — validates existence first
- `ContractRepository.softDelete` — sets deletedAt
- `ContractRepository.count` — excludes soft-deleted
- `ContractRepository.addVersion` — correctly increments version number using MAX+1
- `ContractRepository.addSigner` — creates signer record
- `ContractRepository.convertFromDeal` — functional but lacks transaction safety
- API routes have standard error handling (try/catch with 500 fallback)
- API client follows established pattern with mockable fetch

---

## Natural Seams for Task Breakdown

### Task 1: Fix Critical Issues in ContractRepository
- Wrap `convertFromDeal` in `prisma.$transaction()` (use interactive transactions)
- Consider fixing `generateNumber` collision risk (e.g., use sequential counter via a separate DB sequence table, or at minimum use `crypto.randomInt`)
- **First proof target** — highest risk, unblocks all other work

### Task 2: Add Repository Tests (src/lib/db/contracts.test.ts)
- Follow established pattern from `contacts.test.ts` (node:test, describe/it, prisma)
- Test all 14 methods including edge cases:
  - findMany filters
  - findUnique returns null for soft-deleted
  - create generates valid number format
  - update throws on nonexistent
  - softDelete sets deletedAt
  - addVersion increments correctly
  - convertFromDeal creates bidirectional link
  - convertFromDeal throws if already exists
  - convertFromDeal throws if deal not found

### Task 3: Add API Client Tests (src/lib/api/contracts.test.ts)
- Follow pattern from `contacts.test.ts` (mock fetch, verify URLs, methods, errors)
- Test all 11 client methods including:
  - getContracts filters passed as query params
  - getContract builds correct URL
  - createContract sends POST with body
  - updateContract sends PATCH with body
  - deleteContract sends DELETE
  - getVersions, addVersion, getSigners, addSigner
  - convertDeal sends POST to correct URL
  - Error handling for all methods (400, 404, 500)

### Task 4: Fix Import Consistency
- Change `apps/web/src/app/api/contracts/route.ts` to use `@/lib/db/contracts` or switch all to relative — pick one pattern

### Potential Task 5: Schema Relation (if in scope)
- Add `Contract @relation(fields: [contractId], references: [id])` to Deal model
- Would require a Prisma migration
- **Only if the milestone explicitly requires it** — may be out of scope for S04

---

## Key Constraints

1. **SQLite database** — no native sequence support
2. **node:test framework** (not Jest/Vitest) — use `tsx --test` for execution
3. **Import convention**: relative imports preferred over `@/` aliases (MEM010)
4. **Soft-delete pattern**: all queries auto-exclude `deletedAt: null`
5. **Singleton repository pattern**: `export const contracts = new ContractRepository()`
6. **Response format**: `{ data: ... }` for single, `{ data: [...], count: N }` for lists

---

## Verification Strategy

1. **Unit tests** for ContractRepository using real Prisma (like contacts.test.ts): `cd apps/web && npx tsx --test src/lib/db/contracts.test.ts`
2. **Unit tests** for ContractApiClient using mocked fetch: `cd apps/web && npx tsx --test src/lib/api/contracts.test.ts`
3. **Manual smoke test** via API: `POST /api/deals/{id}/convert` creates contract with correct number format and bidirectional link
4. **Edge case**: converting a deal that already has a contract returns 409
5. **Edge case**: adding version to nonexistent contract
