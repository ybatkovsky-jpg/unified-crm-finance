---
id: T02
parent: S02
milestone: M005
key_files: []
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-23T11:14:38.386Z
blocker_discovered: false
---

# T02: Created BOMApiClient with 11 typed methods, BOM types, and 44 tests passing

**Created BOMApiClient with 11 typed methods, BOM types, and 44 tests passing**

## What Happened

Created apps/web/src/lib/api/bom.ts with BOMApiClient class following the CounterpartyApiClient pattern from S01. All methods use fetchFn with parseApiError on !ok and parseJson on success. The class supports constructor dependency injection of baseUrl, fetch, and headers for testability.

Methods implemented: getBOM(projectId) → GET /api/bom?projectId=X, getBOMById(id) → GET /api/bom/[id], createBOM(data) → POST /api/bom, updateBOM(id, data) → PATCH /api/bom/[id], deleteBOM(id) → DELETE /api/bom/[id], lockBOM(id) → POST /api/bom/[id]/lock, unlockBOM(id) → POST /api/bom/[id]/unlock, getBOMItems(bomId) → GET /api/bom/[bomId]/items, addBOMItems(bomId, items[]) → POST /api/bom/[bomId]/items, updateBOMItem(id, data) → PATCH /api/bom/items/[id], deleteBOMItem(id) → DELETE /api/bom/items/[id].

Added BOM types to apps/web/src/lib/api/types.ts: BOMData (Omit<BOM, 'BOMItem'> with items?, sourceFile?, project?), BOMItemData (Omit with supplier?), BOMFilters, BOMListParams, BOMCreateInput, BOMUpdateInput, BOMItemCreateInput, BOMItemUpdateInput. Imported BOM and BOMItem from @prisma/client.

Singleton export as `bomApi` with destructured convenience methods: getBOM, getBOMById, createBOM, updateBOM, deleteBOM, lockBOM, unlockBOM, getBOMItems, addBOMItems, updateBOMItem, deleteBOMItem.

Created apps/web/src/lib/api/bom.test.ts with 44 tests using node:test: getBOM (4 tests), getBOMById (3), createBOM (3), updateBOM (4), deleteBOM (4), lockBOM (5), unlockBOM (3), getBOMItems (4), addBOMItems (4), updateBOMItem (4), deleteBOMItem (4), singleton instance (2). All 44 pass.

## Verification

Ran `npx tsx --test src/lib/api/bom.test.ts` — exit code 0, 44/44 tests pass, ~837ms total duration. Tests cover all 11 API methods: success paths, error paths (400, 404, 409, 500), empty ID validation, correct HTTP method verification, URL verification for lock/unlock, singleton and convenience export verification.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsx --test src/lib/api/bom.test.ts` | 0 | pass | 837ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

None.
