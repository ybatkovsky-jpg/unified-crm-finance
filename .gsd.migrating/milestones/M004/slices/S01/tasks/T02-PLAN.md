---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T02: Create ProductionRepository

Create ProductionRepository following DealRepository pattern with CRUD, softDelete, findMany with filters.

## Inputs

- `apps/web/src/lib/db/deals.ts`

## Expected Output

- `ProductionRepository class implemented`
- `CRUD methods working`

## Verification

npx tsc --noEmit apps/web/src/lib/db/production.ts
