---
estimated_steps: 10
estimated_files: 4
skills_used: []
---

# T01: Pipeline API endpoint with client and tests

Why: The kanban board currently derives stages from deals via extractStagesFromDeals(), so empty stages disappear and the board shows 'No pipeline stages found' when no deals exist. A dedicated pipeline API is needed to return stages independently.

Do:
1. Create GET /api/pipelines route (apps/web/src/app/api/pipelines/route.ts) that lists all active pipelines (where isActive=true) using prisma.pipeline.findMany()
2. Create GET /api/pipelines/[id] route (apps/web/src/app/api/pipelines/[id]/route.ts) that returns a single pipeline with its stages included, sorted by order ASC. Use prisma.pipeline.findUnique({ where: { id }, include: { DealStage: { orderBy: { order: 'asc' } } } }). Return 404 if not found.
3. Add PipelineApiClient to apps/web/src/lib/api/pipelines.ts with getPipelines() and getPipeline(id) methods. Follow the exact pattern from DealApiClient (private url(), same error handling via parseApiError/parseJson). Export singleton as pipelinesApi.
4. Write unit tests at apps/web/src/lib/api/pipelines.test.ts using node:test + tsx (same pattern as contacts.test.ts and deals.test.ts). Mock fetch to verify: list returns pipelines, getPipeline returns pipeline with stages, 404 handling, network error propagation, getPipeline with empty id throws.
5. PipelineData type already exists in types.ts (imported from @prisma/client). Define a PipelineWithStages type locally in the client or route for the include shape.

Verify command: cd apps/web && npx tsx --test src/lib/api/pipelines.test.ts
Expected ~12-16 tests passing.

Done when: GET /api/pipelines returns active pipelines, GET /api/pipelines/[id] returns pipeline with stages sorted by order, all tests pass.

## Inputs

- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/api/shared.ts`
- `apps/web/src/lib/api/deals.ts`
- `apps/web/src/lib/api/deals.test.ts`
- `apps/web/prisma/schema.prisma`
- `apps/web/prisma/seed-deals.ts`

## Expected Output

- `apps/web/src/app/api/pipelines/route.ts`
- `apps/web/src/app/api/pipelines/[id]/route.ts`
- `apps/web/src/lib/api/pipelines.ts`
- `apps/web/src/lib/api/pipelines.test.ts`

## Verification

cd apps/web && npx tsx --test src/lib/api/pipelines.test.ts

## Observability Impact

New REST endpoints GET /api/pipelines and GET /api/pipelines/[id] with standard JSON error responses. PipelineApiClient follows established pattern for typed fetch with ApiClientError propagation.
