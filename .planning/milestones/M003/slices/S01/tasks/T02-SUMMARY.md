---
id: T02
parent: S01
milestone: M003
key_files:
  - apps/web/src/lib/api/deals.test.ts
key_decisions:
  - Pagination params (skip/take) exist in DealListParams type but are not serialized by DealApiClient.url() — documented in test rather than modifying source outside task scope
duration: 
verification_result: passed
completed_at: 2026-06-21T14:21:54.329Z
blocker_discovered: false
---

# T02: Added 44 unit tests for DealApiClient covering all CRUD operations, moveDeal, error handling, network errors, and URL construction with mocked fetch

**Added 44 unit tests for DealApiClient covering all CRUD operations, moveDeal, error handling, network errors, and URL construction with mocked fetch**

## What Happened

Created apps/web/src/lib/api/deals.test.ts following the contacts.test.ts pattern. Tests use node:test + node:assert with mocked fetch returning controlled responses. All 44 tests pass.

Test coverage by method:
- getDeals (9 tests): list with count, pipelineId/stageId/status/managerId/contactId filters, undefined param skipping, API error (500), empty response
- getDeal (5 tests): single deal by ID, nested relations (stage/pipeline/contact/manager/history), empty ID validation, 404, URL construction
- createDeal (5 tests): 201 creation, POST method + JSON body, optional fields, validation error (missing title), validation error (missing pipelineId)
- updateDeal (4 tests): update, PATCH method, empty ID validation, 404
- deleteDeal (4 tests): soft-delete, empty ID validation, 404, DELETE method
- moveDeal (7 tests): stage transition, POST to /deals/[id]/move, empty ID validation, missing stageId validation, no-change error (409), comment payload, 404
- network errors (3 tests): fetch rejection propagation, non-JSON error response, non-JSON with empty statusText
- ApiClientError (2 tests): correct properties, Error inheritance
- singleton instance (2 tests): default export, convenience methods
- URL construction (3 tests): custom baseUrl, multiple filter params combined, pagination params documented as unsupported

One deviation: pagination params (skip/take) are in the DealListParams type but not serialized by the current client implementation. Added a test documenting this limitation rather than modifying source code outside the task scope.

## Verification

cd apps/web && npx tsx --test src/lib/api/deals.test.ts — 44 tests, 0 failures
cd apps/web && npx tsx --test src/lib/db/deals.test.ts — 34 tests, 0 failures (slice-level verification)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd apps/web && npx tsx --test src/lib/api/deals.test.ts` | 0 | pass | 604ms |
| 2 | `cd apps/web && npx tsx --test src/lib/db/deals.test.ts` | 0 | pass | 907ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/api/deals.test.ts`
