---
estimated_steps: 4
estimated_files: 2
skills_used: []
---

# T02: Write ProjectRepository unit tests

Create unit tests for ProjectRepository in apps/web/src/lib/db/projects.test.ts. Test CRUD operations (create, findMany, findUnique, update, softDelete), soft-delete behavior (excluded from queries), count accuracy, and query methods (findByStatus, findByManager, findByContact, findByDeal). Use test fixtures and cleanup between tests. Follow DealRepository.test pattern.

**Why:** Tests verify repository correctness before API layer depends on it.

**Do:** Create apps/web/src/lib/db/projects.test.ts with node:test suite. Test each repository method with fixtures. Verify soft-delete excludes records. Verify count returns correct totals.

**Done when:** All tests pass (node --test), covering CRUD, soft-delete, count, and query methods.

## Inputs

- `apps/web/src/lib/db/projects.ts`
- `apps/web/src/lib/db/deals.test.ts`

## Expected Output

- `apps/web/src/lib/db/projects.test.ts`

## Verification

node --test src/lib/db/projects.test.ts

## Observability Impact

Test assertions provide verification; test failures indicate incorrect behavior
