---
estimated_steps: 13
estimated_files: 1
skills_used: []
---

# T02: Write DealApiClient unit tests with mocked fetch

The DealApiClient (apps/web/src/lib/api/deals.ts) is fully implemented with getDeals, getDeal, createDeal, updateDeal, deleteDeal, moveDeal — but has zero test coverage. This task writes unit tests with mocked fetch (same pattern as contacts.test.ts).

Do:
1. Create test file at apps/web/src/lib/api/deals.test.ts
2. Use node:test + node:assert with mocked fetch returning controlled responses
3. Create mock data factory for DealData (with nested stage/pipeline/contact/manager/history)
4. Test getDeals: returns {data, count}, applies pipelineId filter, stageId filter, status filter
5. Test getDeal: returns {data: deal}, 404 for missing, throws ApiClientError on empty id
6. Test createDeal: returns {data: deal} with 201, handles validation error (400, missing title)
7. Test updateDeal: returns updated deal, 404 for missing
8. Test deleteDeal: returns {data: deal}, 404 for missing
9. Test moveDeal: returns updated deal with new stageId, handles validation error (missing stageId), handles no-change error
10. Test network error: fetch rejection, parseApiError with non-JSON response

Done when: all tests pass with zero failures.

## Inputs

- `apps/web/src/lib/api/deals.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/api/shared.ts`

## Expected Output

- `apps/web/src/lib/api/deals.test.ts`

## Verification

cd apps/web && npx tsx --test src/lib/api/deals.test.ts

## Observability Impact

ApiClientError thrown on non-2xx responses includes statusCode, error, and message fields. Mocked fetch tests verify error propagation without real HTTP calls.
