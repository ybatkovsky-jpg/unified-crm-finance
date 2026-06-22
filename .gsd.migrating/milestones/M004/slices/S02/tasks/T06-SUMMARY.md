---
id: T06
parent: S02
milestone: M004
key_files:
  - apps/web/src/lib/api/projects.test.ts
key_decisions:
  - Followed DealApiClient.test pattern for consistency with existing API client tests
  - Used mock factories (mockProject, mockStage, mockMember) to reduce test duplication
  - Tested URL construction explicitly to verify endpoint paths and query serialization
duration: 
verification_result: passed
completed_at: 2026-06-22T09:58:59.057Z
blocker_discovered: false
---

# T06: Created ProjectApiClient tests with 44 passing tests covering all CRUD methods, error handling, URL construction, and network failures

**Created ProjectApiClient tests with 44 passing tests covering all CRUD methods, error handling, URL construction, and network failures**

## What Happened

Created `apps/web/src/lib/api/projects.test.ts` with comprehensive test suite following the DealApiClient.test pattern. The tests use node:test with mocked fetch to verify:

1. **getProjects**: Returns list with count, applies all filters (status, managerId, contactId, dealId), pagination (skip/take), skips undefined params, handles errors and empty responses
2. **getProject**: Returns single project by ID, includes nested relations (stage, members), validates ID requirement, handles 404, verifies URL construction
3. **createProject**: Creates with required and optional fields, sends POST with JSON body, handles validation errors (400)
4. **updateProject**: Updates project fields including budget and dates, sends PATCH request, validates ID, handles 404
5. **deleteProject**: Soft-deletes and returns data, sends DELETE request, validates ID, handles 404
6. **Network errors**: Propagates fetch rejections, handles non-JSON error responses
7. **ApiClientError**: Validates error class properties and Error inheritance
8. **Singleton instance**: Confirms default export and convenience methods
9. **URL construction**: Custom baseUrl, combined filters and pagination
10. **URL paths**: Verifies correct endpoint paths for all operations

All 44 tests pass in ~76ms.

## Verification

Ran `npx tsx --test src/lib/api/projects.test.ts` - all 44 tests pass covering success paths, error handling (400, 404, 500), network failures, URL construction, and the singleton export pattern.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsx --test src/lib/api/projects.test.ts` | 0 | pass | 762ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/api/projects.test.ts`
