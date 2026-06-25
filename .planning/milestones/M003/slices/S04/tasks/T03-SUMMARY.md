---
id: T03
parent: S04
milestone: M003
key_files:
  - apps/web/src/lib/api/contracts.test.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-21T15:40:26.972Z
blocker_discovered: false
---

# T03: Added comprehensive unit tests for ContractApiClient covering all 11 methods with node:test, including filter params, error handling, and network errors

**Added comprehensive unit tests for ContractApiClient covering all 11 methods with node:test, including filter params, error handling, and network errors**

## What Happened

Created apps/web/src/lib/api/contracts.test.ts with 41 tests covering:
- getContracts: list with count, all filter params (status, contactId, dealId), undefined params skipped
- getContract: single by ID, empty ID validation, 404 handling, URL building
- createContract: POST with JSON body, 201 response, validation error (400)
- updateContract: PATCH with body, empty ID validation, 404 handling
- deleteContract: DELETE, empty ID validation, 404 handling
- getVersions: GET /contracts/[id]/versions, 404 handling
- addVersion: POST with contentMd, generatedPdfFileId, createdBy
- getSigners: GET /contracts/[id]/signers
- addSigner: POST with name, optional position, signatureFileId
- convertDeal: POST /deals/[id]/convert, 404 for missing deal
- Network errors: fetch rejection, non-JSON responses, API error with non-JSON

All tests use mocked fetch following the pattern established in contacts.test.ts from S01/M002.

## Verification

cd apps/web && npx tsx --test src/lib/api/contracts.test.ts passed with 41/41 tests, covering all 11 ContractApiClient methods with filter params, validation, error handling (400/404/500), and network edge cases (fetch rejection, non-JSON responses)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd apps/web && npx tsx --test src/lib/api/contracts.test.ts` | 0 | PASS | 581ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/api/contracts.test.ts`
