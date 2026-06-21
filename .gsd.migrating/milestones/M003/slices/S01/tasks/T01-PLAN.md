---
estimated_steps: 14
estimated_files: 1
skills_used: []
---

# T01: Write DealRepository unit tests

The DealRepository (apps/web/src/lib/db/deals.ts) is fully implemented with create, findMany, findUnique, update, moveStage, softDelete, getHistory, count, and helper queries — but has zero test coverage. This task writes comprehensive unit tests using node:test (same pattern as contacts.test.ts).

Do:
1. Create test file at apps/web/src/lib/db/deals.test.ts
2. Clean up test data before each test (delete deals with known test markers)
3. Test create: verify UUID generation, С-YYYY-NNNNN number format, required fields, defaults (amount=0, currency=RUB)
4. Test findMany: unfiltered, by pipelineId, by stageId, status=open (closedAt=null), status=closed (closedAt not null), exclude soft-deleted
5. Test findUnique: existing deal, non-existent returns null, with includes (stage/pipeline/contact/history)
6. Test update: valid fields, non-existent deal throws
7. Test moveStage: successful transition creates DealHistory record, same stage rejects, transition to won stage sets closedAt, transition to lost stage sets closedAt
8. Test softDelete: sets deletedAt, excluded from findMany, excluded from findUnique
9. Test getHistory: returns entries ordered by changedAt desc
10. Test count: returns correct count excluding soft-deleted
11. Test findByPipeline, findByStage, findByManager, findByContact helper methods

Done when: all tests pass with zero failures and zero unhandled rejections.

## Inputs

- `apps/web/src/lib/db/deals.ts`
- `apps/web/src/lib/db/prisma.ts`
- `apps/web/prisma/schema.prisma`
- `apps/web/prisma/seed-deals.ts`

## Expected Output

- `apps/web/src/lib/db/deals.test.ts`

## Verification

cd apps/web && npx tsx --test src/lib/db/deals.test.ts

## Observability Impact

Test failures surface as node:test assertion errors with stack traces. DealRepository.create errors (missing required fields) surface via Prisma validation errors. moveStage failures (missing deal) surface via thrown Error with descriptive message.
