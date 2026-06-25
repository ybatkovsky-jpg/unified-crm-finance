# S01: Production Schema + Repository

**Goal:** Create Production model schema and Repository layer for production tracking
**Demo:** ProductionRepository passes all unit tests (CRUD + softDelete), Prisma migration applies successfully

## Must-Haves

- Production model exists with proper relations (1:N to Project, ProductionStage cascade), Repository CRUD operations work, softDelete pattern consistent

## Proof Level

- This slice proves: repo_tests_pass

## Integration Closure

Production model ready for API layer

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [x] **T01: Create Production and ProductionStage Prisma models** `est:30m`
  Add Production and ProductionStage models to schema.prisma with proper relations, indexes, and cascade behavior.
  - Files: `apps/web/prisma/schema.prisma`
  - Verify: npx prisma migrate dev --name add_production

- [x] **T02: Create ProductionRepository** `est:45m`
  Create ProductionRepository following DealRepository pattern with CRUD, softDelete, findMany with filters.
  - Files: `apps/web/src/lib/db/production.ts`
  - Verify: npx tsc --noEmit apps/web/src/lib/db/production.ts

- [x] **T03: Write ProductionRepository unit tests** `est:30m`
  Write unit tests for ProductionRepository covering CRUD, softDelete, filters.
  - Files: `apps/web/src/lib/db/production.test.ts`
  - Verify: tsx apps/web/src/lib/db/production.test.ts

## Files Likely Touched

- apps/web/prisma/schema.prisma
- apps/web/src/lib/db/production.ts
- apps/web/src/lib/db/production.test.ts
