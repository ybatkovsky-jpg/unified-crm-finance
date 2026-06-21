---
id: T03
parent: S03
milestone: M002
key_files:
  - apps/web/src/lib/api/interactions.ts
  - apps/web/src/lib/api/interactions.test.ts
  - apps/web/src/lib/api/types.ts
  - apps/web/src/lib/api/shared.ts
  - apps/web/src/lib/api/contacts.ts
key_decisions:
  - Extracted shared API client helpers (ApiClientError, parseApiError, parseJson) to shared.ts instead of duplicating across clients
duration: 
verification_result: passed
completed_at: 2026-06-21T08:48:57.297Z
blocker_discovered: false
---

# T03: Created InteractionApiClient with types, shared helpers, and 30 passing tests

**Created InteractionApiClient with types, shared helpers, and 30 passing tests**

## What Happened

Added InteractionData, InteractionCreateInput, InteractionUpdateInput, and InteractionFilters types to types.ts. Extracted ApiClientError, parseApiError, and parseJson to a shared.ts module to avoid duplication between ContactApiClient and the new InteractionApiClient — refactored contacts.ts to import from shared. Created interactions.ts with InteractionApiClient class mirroring ContactApiClient pattern: constructor with configurable baseUrl/fetchFn/headers, private url() helper, and methods getInteractions(filters?), getInteraction(id), createInteraction(data), updateInteraction(id, data), deleteInteraction(id), getContactInteractions(contactId). Singleton export as interactionsApi with convenience destructured exports. Wrote 30 tests across 9 suites covering all methods including success, error paths (400/404/500), empty responses, HTTP method verification, and URL construction. All 30 interaction tests pass, all 25 contact tests pass after refactoring, and Next.js build succeeds with all routes registered.

## Verification

npx tsx --test src/lib/api/interactions.test.ts: 30 tests, 0 fail, 9 suites passed. npx tsx --test src/lib/api/contacts.test.ts: 25 tests, 0 fail (regression check after refactoring). npx next build: compiled successfully, all API routes registered including /api/interactions, /api/interactions/[id], /api/contacts/[id]/interactions.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsx --test src/lib/api/interactions.test.ts` | 0 | pass | 554ms |
| 2 | `npx tsx --test src/lib/api/contacts.test.ts` | 0 | pass | 552ms |
| 3 | `npx next build` | 0 | pass | 17000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/api/interactions.ts`
- `apps/web/src/lib/api/interactions.test.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/api/shared.ts`
- `apps/web/src/lib/api/contacts.ts`
