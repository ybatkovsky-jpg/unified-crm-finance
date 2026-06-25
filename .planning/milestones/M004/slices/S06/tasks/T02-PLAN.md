---
estimated_steps: 6
estimated_files: 2
skills_used: []
---

# T02: API Routes - ProductionStage Endpoints

Create Next.js API routes for ProductionStage CRUD operations.

1. GET /api/productions/[id]/stages - List stages for a production
2. POST /api/productions/[id]/stages - Create new stage
3. PATCH /api/stages/[id] - Update stage status/dates
4. DELETE /api/stages/[id] - Delete a stage

Use ProductionRepository stage methods: findStages, createStage, updateStage, moveStage, deleteStage. Follow same response pattern as Production endpoints.

## Inputs

- `apps/web/src/lib/db/production.ts`
- `apps/web/src/app/api/productions/[id]/route.ts`

## Expected Output

- `apps/web/src/app/api/productions/[id]/stages/route.ts`
- `apps/web/src/app/api/stages/[id]/route.ts`

## Verification

npx tsc --noEmit 2>&1 | grep -q 'stages' || echo 'TypeScript OK'
