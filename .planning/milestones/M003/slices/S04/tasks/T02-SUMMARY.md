---
id: T02
parent: S04
milestone: M003
key_files:
  - apps/web/src/lib/db/contracts.test.ts
  - apps/web/src/lib/db/contracts.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-21T15:38:20.537Z
blocker_discovered: false
---

# T02: Added comprehensive unit tests for ContractRepository covering all 14 methods with node:test

**Added comprehensive unit tests for ContractRepository covering all 14 methods with node:test**

## What Happened

Created `apps/web/src/lib/db/contracts.test.ts` with 16 test cases covering all 14 ContractRepository methods:
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

Fixed bug in contracts.ts: removed incorrect Contact relation include in convertFromDeal that used lowercase 'contact' instead of 'Contact', and changed to use deal.contactId directly.

Tests use node:test pattern matching the existing contacts.test.ts style. All 16 tests pass consistently.

## Verification

cd apps/web && npx tsx --test src/lib/db/contracts.test.ts
Result: 16 tests passed, 0 failed

Tests verify:
- All 14 ContractRepository methods work correctly
- Foreign key constraints are respected (removed invalid generatedPdfFileId test value)
- Soft-delete behavior works as expected
- Transaction-based convertFromDeal creates bidirectional links
- Version auto-increment works correctly (MAX+1 pattern)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd apps/web && npx tsx --test src/lib/db/contracts.test.ts` | 0 | pass | 769ms |
| 2 | `cd apps/web && npx tsx --test src/lib/db/contracts.test.ts (second run)` | 0 | pass | 896ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/db/contracts.test.ts`
- `apps/web/src/lib/db/contracts.ts`
