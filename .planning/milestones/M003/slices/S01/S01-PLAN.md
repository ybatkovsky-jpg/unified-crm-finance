# S01: Deal Repository and API

**Goal:** curl POST /api/deals creates deal with auto-number С-YYYY-NNNNN; POST /api/deals/[id]/move changes stage and writes DealHistory; GET /api/deals returns deals with filters
**Demo:** curl POST /api/deals создаёт сделку с автонумерацией С-YYYY-NNNNN; PUT /api/deals/[id]/move меняет stage и пишет DealHistory; GET /api/deals возвращает сделки с фильтрами

## Must-Haves

- DealRepository.create generates UUID and number in С-YYYY-NNNNN format
- DealRepository.moveStage creates DealHistory record and updates stage
- API route POST /api/deals returns 201 with created deal
- API route POST /api/deals/[id]/move updates stage and returns updated deal
- API route GET /api/deals returns deals with filters (pipelineId, stageId, status)
- All repository and API client tests pass (zero failures)

## Proof Level

- This slice proves: contract

## Integration Closure

- Upstream surfaces consumed: apps/web/src/lib/db/prisma.ts (PrismaClient singleton), apps/web/prisma/schema.prisma (Deal/DealHistory/DealStage/Pipeline models), apps/web/prisma/seed-deals.ts (pipeline seed data for tests)
- New wiring introduced in this slice: test files only — no new runtime wiring; existing routes at apps/web/src/app/api/deals/* are already wired via Next.js App Router file-system routing
- What remains before the milestone is truly usable end-to-end: S02 (Kanban Board UI), S03 (Deal Detail + History Timeline), S04 (Contract Repository, API, Conversion), S05 (Contract Pages)

## Verification

- DealRepository tests verify the DB layer contract; DealApiClient tests verify the HTTP layer contract. Failures surface as test assertion errors with descriptive messages. No runtime observability changes — this slice adds test coverage only.

## Tasks

- [x] **T01: Write DealRepository unit tests** `est:45m`
  The DealRepository (apps/web/src/lib/db/deals.ts) is fully implemented with create, findMany, findUnique, update, moveStage, softDelete, getHistory, count, and helper queries — but has zero test coverage. This task writes comprehensive unit tests using node:test (same pattern as contacts.test.ts).
  - Files: `apps/web/src/lib/db/deals.test.ts`
  - Verify: cd apps/web && npx tsx --test src/lib/db/deals.test.ts

- [x] **T02: Write DealApiClient unit tests with mocked fetch** `est:30m`
  The DealApiClient (apps/web/src/lib/api/deals.ts) is fully implemented with getDeals, getDeal, createDeal, updateDeal, deleteDeal, moveDeal — but has zero test coverage. This task writes unit tests with mocked fetch (same pattern as contacts.test.ts).
  - Files: `apps/web/src/lib/api/deals.test.ts`
  - Verify: cd apps/web && npx tsx --test src/lib/api/deals.test.ts

## Files Likely Touched

- apps/web/src/lib/db/deals.test.ts
- apps/web/src/lib/api/deals.test.ts
