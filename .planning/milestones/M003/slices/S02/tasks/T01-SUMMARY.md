---
id: T01
parent: S02
milestone: M003
key_files:
  - apps/web/src/app/api/pipelines/route.ts
  - apps/web/src/app/api/pipelines/[id]/route.ts
  - apps/web/src/lib/api/pipelines.ts
  - apps/web/src/lib/api/pipelines.test.ts
key_decisions:
  - Used prisma.pipeline.findMany/findUnique directly (matching convert route pattern) rather than creating a db repository module since pipelines are read-only endpoints
  - Defined PipelineWithStages locally in the client module rather than in types.ts to keep the type close to its usage and avoid importing Prisma include shapes in the shared types file
  - Used Next.js 15 async params API (params: Promise<{id}>) for the [id] route to match the latest Next.js conventions
duration: 
verification_result: passed
completed_at: 2026-06-21T14:45:14.900Z
blocker_discovered: false
---

# T01: Created Pipeline API endpoints (GET /api/pipelines list and GET /api/pipelines/[id] with stages), PipelineApiClient with getPipelines/getPipeline methods, and 18 unit tests

**Created Pipeline API endpoints (GET /api/pipelines list and GET /api/pipelines/[id] with stages), PipelineApiClient with getPipelines/getPipeline methods, and 18 unit tests**

## What Happened

Created four files for the Pipeline API:

1. **GET /api/pipelines route** (`apps/web/src/app/api/pipelines/route.ts`): Lists all active pipelines (isActive=true) using prisma.pipeline.findMany(). Returns standard `{ data, count }` JSON shape.

2. **GET /api/pipelines/[id] route** (`apps/web/src/app/api/pipelines/[id]/route.ts`): Returns a single pipeline with DealStage[] included, sorted by order ASC. Returns 404 with `{ error, message }` shape when pipeline not found. Matches Next.js 15 async params API.

3. **PipelineApiClient** (`apps/web/src/lib/api/pipelines.ts`): Follows the exact DealApiClient/ContactApiClient pattern with private url() method, parseApiError/parseJson error handling, and ApiClientError propagation. Exports a PipelineWithStages type containing PipelineData with DealStage[] included. Singleton exported as `pipelinesApi` with convenience method exports.

4. **Unit tests** (`apps/web/src/lib/api/pipelines.test.ts`): 18 tests across 7 suites using node:test + tsx, matching the contacts.test.ts and deals.test.ts patterns (mock factories, createMockFetch, direct fetchFn injection). Tests cover: list and empty list, pipeline with stages (order, isWonStage/isLostStage flags, isActive), 404 handling, empty id validation, network error propagation, ApiClientError properties, singleton instance verification, and URL construction with custom baseUrl.

## Verification

Ran `npx tsx --test src/lib/api/pipelines.test.ts` — all 18 tests passed (18/18, 0 failures, ~1.67s). Tests cover: getPipelines (list, empty, error, URL), getPipeline (with stages sorted, flags, isActive, empty id, 404, URL), network errors (getPipelines and getPipeline), ApiClientError properties, singleton instance, and URL construction with custom/default baseUrl.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd apps/web && npx tsx --test src/lib/api/pipelines.test.ts` | 0 | pass | 1673ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/pipelines/route.ts`
- `apps/web/src/app/api/pipelines/[id]/route.ts`
- `apps/web/src/lib/api/pipelines.ts`
- `apps/web/src/lib/api/pipelines.test.ts`
