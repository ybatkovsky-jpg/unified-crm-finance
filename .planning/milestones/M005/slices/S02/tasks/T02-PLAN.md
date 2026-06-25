---
estimated_steps: 8
estimated_files: 3
skills_used: []
---

# T02: BOMApiClient + API types + tests

Why: Typed API client layer between UI components and API routes. Following the CounterpartyApiClient pattern proven in S01.

Do:
1. Add BOM types to apps/web/src/lib/api/types.ts: BOMData (extends Prisma BOM with items?), BOMItemData, BOMCreateInput (projectId, sourceFileId?, items?: BOMItemCreateInput[]), BOMItemCreateInput (rowNumber, name, article?, category?, quantity, unit?, price?, supplierId?, notes?), BOMItemUpdateInput (all optional), BOMUpdateInput (status?, sourceFileId?)
2. Create apps/web/src/lib/api/bom.ts with BOMApiClient class: constructor(ApiClientConfig), getBOM(projectId), getBOMById(id), createBOM(data), updateBOM(id, data), deleteBOM(id), lockBOM(id), unlockBOM(id), getBOMItems(bomId), addBOMItems(bomId, items[]), updateBOMItem(id, data), deleteBOMItem(id)
3. All methods use fetchFn with proper error handling (parseApiError on !ok, parseJson on success)
4. Singleton export + convenience destructured exports
5. Create apps/web/src/lib/api/bom.test.ts with node:test — mock fetchFn, test all methods, test error paths (400, 404, 500), test singleton

Done when: All tests pass with `npx tsx --test src/lib/api/bom.test.ts`

## Inputs

- `apps/web/src/lib/api/counterparties.ts`
- `apps/web/src/lib/api/shared.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/prisma/schema.prisma`

## Expected Output

- `apps/web/src/lib/api/bom.ts`
- `apps/web/src/lib/api/bom.test.ts`

## Verification

npx tsx --test src/lib/api/bom.test.ts
