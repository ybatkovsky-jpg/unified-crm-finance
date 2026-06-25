---
estimated_steps: 9
estimated_files: 2
skills_used: []
---

# T01: BOMRepository — CRUD for BOM and BOMItem

Why: Foundation data layer. Without BOMRepository, no other layer can function. The BOM model has a @unique projectId constraint (1 BOM per project), and BOMItem is a child with onDelete: Cascade.

Do:
1. Create apps/web/src/lib/db/bom.ts with BOMRepository class following CounterpartyRepository pattern (singleton, manual UUID via randomUUID(), manual updatedAt on updates, import prisma from './prisma')
2. Methods: create(data: { projectId, sourceFileId?, items? }), findById(id, includeItems?), findByProjectId(projectId, includeItems?), update(id, data), delete(id), lock(id), unlock(id)
3. BOMItem methods on the same class: createItem(data), findItemsByBomId(bomId), updateItem(id, data), deleteItem(id), bulkCreateItems(bomId, items[])
4. create() must auto-create BOM with id=randomUUID(), updatedAt=new Date(), status='draft', version=1
5. lock() sets status='locked', unlock() sets status='draft'
6. Create apps/web/src/lib/db/bom.test.ts with node:test — tests: create BOM, findById, findByProjectId, update, delete, lock, unlock, createItem, findItemsByBomId, updateItem, deleteItem, bulkCreateItems, unique projectId constraint error

Done when: All 12+ tests pass with `npx tsx --test src/lib/db/bom.test.ts`

## Inputs

- `apps/web/src/lib/db/prisma.ts`
- `apps/web/src/lib/db/counterparties.ts`
- `apps/web/prisma/schema.prisma`

## Expected Output

- `apps/web/src/lib/db/bom.ts`
- `apps/web/src/lib/db/bom.test.ts`

## Verification

npx tsx --test src/lib/db/bom.test.ts
