---
estimated_steps: 17
estimated_files: 1
skills_used: []
---

# T03: Add ContractApiClient unit tests (11 methods)

## Why
ContractApiClient has zero test coverage. Following S01/M002 pattern, unit tests with mocked fetch verify correct HTTP requests, URLs, methods, and error handling.

## Do
Write apps/web/src/lib/api/contracts.test.ts with node:test + undici MockAgent covering:
- getContracts: list with count, all filter params (status, contactId, dealId), undefined params skipped
- getContract: single by ID, nested relations, empty ID validation, 404 handling
- createContract: POST with JSON body, 201 response, validation error (400)
- updateContract: PATCH with body, empty ID validation, 404 handling
- deleteContract: DELETE, empty ID validation, 404 handling
- getVersions: GET /contracts/[id]/versions, 404 handling
- addVersion: POST with contentMd, generatedPdfFileId, createdBy
- getSigners: GET /contracts/[id]/signers
- addSigner: POST with name, optional position, signatureFileId
- convertDeal: POST /deals/[id]/convert, 404 for missing deal
- Network errors: fetch rejection, non-JSON responses

## Done when
- cd apps/web && npx tsx --test src/lib/api/contracts.test.ts passes with 0 failures

## Inputs

- `apps/web/src/lib/api/contracts.ts`
- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/lib/api/contracts.test.ts`

## Verification

cd apps/web && npx tsx --test src/lib/api/contracts.test.ts

## Observability Impact

Test assertion errors provide descriptive failure messages — no runtime observability changes
