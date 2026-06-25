---
estimated_steps: 6
estimated_files: 3
skills_used: []
---

# T03: Interaction API client + types

Why: Frontend needs a typed API client for interactions like the ContactApiClient from S01. Types must be added to the shared types.ts for InteractionData, create/update inputs.

Do:
1. Add interaction types to src/lib/api/types.ts: InteractionData (using Prisma Interaction type), InteractionCreateInput (contactId, type, direction?, subject?, content?, scheduledAt?, completedAt?, authorId), InteractionUpdateInput (all optional), InteractionFilters (contactId?, type?). Reuse existing ApiResponse, ApiListResponse, ApiClientConfig.
2. Create src/lib/api/interactions.ts — InteractionApiClient class mirroring ContactApiClient: constructor with baseUrl/fetchFn/headers, private url() helper. Methods: getInteractions(filters?), getInteraction(id), createInteraction(data), updateInteraction(id, data), deleteInteraction(id), getContactInteractions(contactId). Use the same parseJson/parseApiError helpers (copy them or extract to shared). Singleton export as interactionsApi with convenience destructured exports.
3. Write tests in src/lib/api/interactions.test.ts — mock fetch pattern same as contacts.test.ts. Test: create (201), getContactInteractions (200 with array), getInteraction (200/404), update (200), delete (200), ApiClientError (400), list with filters.

Done when: `npx tsx --test src/lib/api/interactions.test.ts` passes (10+ tests expected).

## Inputs

- `apps/web/src/lib/api/contacts.ts`
- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/lib/api/interactions.ts`
- `apps/web/src/lib/api/interactions.test.ts`

## Verification

npx tsx --test src/lib/api/interactions.test.ts

## Observability Impact

console.error on API client fetch failures (same pattern as ContactApiClient); structured ApiClientError with statusCode/error/message
