# S01: Deal Repository and API — UAT

**Milestone:** M003
**Written:** 2026-06-21T14:38:16.998Z


# S01 UAT: Deal Repository and API

## UAT Type
API Contract Verification (automated tests)

## Preconditions
1. Database is seeded with a default pipeline (code='default') and 8 stages (new → won/lost)
2. At least one contact exists for deal association
3. Test runner (`npx tsx --test`) is available in apps/web

## Steps

### Step 1: Verify Deal CRUD via Repository
- Run: `cd apps/web && npx tsx --test src/lib/db/deals.test.ts`
- Expected: 34 tests pass, 0 failures
- Validates: Create (UUID + С-YYYY-NNNNN numbering), Read (findMany/findUnique with includes), Update (valid fields, error on missing/deleted), Soft Delete (deletedAt + query exclusion)

### Step 2: Verify Deal Stage Movement
- Run: same as Step 1 (moveStage tests are part of the suite)
- Expected: moveStage test passes — creates DealHistory record, sets closedAt for won/lost stages
- Note: same-stage move records history without rejection (documented behavior)

### Step 3: Verify Deal API Client Contract
- Run: `cd apps/web && npx tsx --test src/lib/api/deals.test.ts`
- Expected: 44 tests pass, 0 failures
- Validates: GET /api/deals (with filters), GET /api/deals/[id], POST /api/deals, PATCH /api/deals/[id], DELETE /api/deals/[id], POST /api/deals/[id]/move

### Step 4: Verify Error Handling
- Run: same as Step 3 (error tests are part of the suite)
- Expected: 404, 400, 409, 500, network errors all handled with ApiClientError
- Validates: Validation errors (missing title/pipelineId/stageId), not-found errors, conflict errors (same-stage), network/parse errors

## Expected Outcomes
- All 78 unit tests pass with 0 failures
- DealRepository.create generates proper UUID (v4 format) and auto-number (С-YYYY-NNNNN)
- DealRepository.moveStage atomically updates stage + writes DealHistory
- DealApiClient handles all CRUD operations with correct HTTP methods and payloads
- DealApiClient surfaces server errors as typed ApiClientError

## Edge Cases Covered
- Soft-deleted deals excluded from all queries
- Missing/non-existent IDs return null or throw appropriate errors
- Empty filter params not serialized in URL
- Non-JSON error response bodies handled gracefully
- Same-stage move (no-op from API perspective) handled without crash
- Concurrent deal numbering (unique С-YYYY-NNNNN per deal)

## Not Proven By This UAT
- End-to-end HTTP integration (tests mock fetch, not a real server)
- Actual API route handlers (these tests verify client and repository contracts, not route wiring)
- UI rendering (covered by S02/S03)
- Real database concurrency under load

