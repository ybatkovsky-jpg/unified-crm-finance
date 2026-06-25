---
id: T01
parent: S02
milestone: M005
key_files: []
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-23T11:09:10.931Z
blocker_discovered: false
---

# T01: Created BOMRepository with full CRUD for BOM and BOMItem, 16 tests passing

**Created BOMRepository with full CRUD for BOM and BOMItem, 16 tests passing**

## What Happened

Created apps/web/src/lib/db/bom.ts with BOMRepository class following the CounterpartyRepository pattern: singleton instance, manual UUID generation via randomUUID(), manual updatedAt on all writes.

BOM methods: create (auto-sets id/status='draft'/version=1/updatedAt, supports nested BOMItem creation), findById, findByProjectId (both with optional includeItems parameter), update, delete (hard delete, cascades to BOMItems), lock (status='locked'), unlock (status='draft').

BOMItem methods: createItem, findItemsByBomId (ordered by rowNumber), updateItem, deleteItem, bulkCreateItems (returns count via createMany).

Key gotcha discovered: the Prisma relation field name matches the model name — BOMItem, not 'items'. Used BOMItem in include and create statements.

Created apps/web/src/lib/db/bom.test.ts with 16 tests covering all CRUD operations: create BOM, findById, findById with items, findByProjectId, null for nonexistent BOM, update, lock, unlock, unique projectId constraint error, createItem, findItemsByBomId, updateItem, bulkCreateItems, deleteItem, create BOM with nested items, and delete BOM cascade to items. All 16 pass.

## Verification

All 16 tests pass: npx tsx --test src/lib/db/bom.test.ts — exit code 0, 16/16 pass, ~985ms total duration. Tests cover: BOM create/find/update/delete/lock/unlock/unique-constraint, BOMItem create/find/update/delete/bulkCreate, nested creation, cascade delete.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsx --test src/lib/db/bom.test.ts` | 0 | pass | 985ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

None.
