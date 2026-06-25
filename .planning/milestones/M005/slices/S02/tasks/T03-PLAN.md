---
estimated_steps: 10
estimated_files: 5
skills_used: []
---

# T03: BOM API Routes — REST endpoints

Why: HTTP API surface for BOM CRUD. Follows the established App Router pattern from S01 counterparty routes. All routes use NextResponse.json({ data }) for success, { error, message } for errors.

Do:
1. Create apps/web/src/app/api/bom/route.ts — GET (list by projectId query param, includes items), POST (create BOM with optional items array, validate projectId required)
2. Create apps/web/src/app/api/bom/[id]/route.ts — GET (single BOM with items + computed total), PUT (update metadata), DELETE (hard delete — BOM has no soft-delete field)
3. Create apps/web/src/app/api/bom/[id]/items/route.ts — GET (list items for BOM), POST (add items array to BOM, validate name+quantity required per item)
4. Create apps/web/src/app/api/bom/items/[id]/route.ts — GET (single item), PUT (update item fields), DELETE (remove item)
5. Create apps/web/src/app/api/bom/[id]/lock/route.ts — POST (lock: set status='locked'), POST (unlock: set status='draft')
6. All routes: try/catch with console.error, 400 for validation, 404 for not found, 500 for server errors
7. params: Promise<{ id: string }> pattern (Next.js 15+)

Done when: All 5 route files exist and TypeScript compiles without errors in these files

## Inputs

- `apps/web/src/lib/db/bom.ts`
- `apps/web/src/app/api/counterparties/route.ts`
- `apps/web/src/app/api/counterparties/[id]/route.ts`
- `apps/web/prisma/schema.prisma`

## Expected Output

- `apps/web/src/app/api/bom/route.ts`
- `apps/web/src/app/api/bom/[id]/route.ts`
- `apps/web/src/app/api/bom/[id]/items/route.ts`
- `apps/web/src/app/api/bom/items/[id]/route.ts`
- `apps/web/src/app/api/bom/[id]/lock/route.ts`

## Verification

npx tsx --test src/lib/db/bom.test.ts
