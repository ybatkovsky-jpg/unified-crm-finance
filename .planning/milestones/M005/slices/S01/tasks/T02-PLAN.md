---
estimated_steps: 28
estimated_files: 3
skills_used: []
---

# T02: Add API types and create CounterpartyApiClient with tests

Why: API client is the typed bridge between UI and backend. Must follow ContactApiClient pattern (class with injectable fetch, singleton + convenience exports). Types must be added to shared types.ts.

Do:
1. Add to `src/lib/api/types.ts`:
   - `CounterpartyData` = Omit<Counterparty, 'deletedAt'>
   - `CounterpartyFilters` = { type?: string; search?: string }
   - `CounterpartyListParams` extends CounterpartyFilters + PaginationOptions
   - `CounterpartyCreateInput` = { name: string; type: string; inn?, kpp?, email?, phone?, contactPerson?, address?, bankName?, bankAccount?, korAccount?, bik?, notes?, rating? }
   - `CounterpartyUpdateInput` = same fields but all optional
2. Create `src/lib/api/counterparties.ts` with CounterpartyApiClient:
   - constructor(config?) — baseUrl, injectable fetch, defaultHeaders
   - url(path, params?) — builds query string
   - getCounterparties(params?) → ApiListResponse<CounterpartyData> — GET /api/counterparties?type=&search=
   - getCounterparty(id) → ApiResponse<CounterpartyData> — GET /api/counterparties/:id
   - createCounterparty(data) → ApiResponse<CounterpartyData> — POST /api/counterparties
   - updateCounterparty(id, data) → ApiResponse<CounterpartyData> — PUT /api/counterparties/:id
   - deleteCounterparty(id) → ApiResponse<CounterpartyData> & { message } — DELETE /api/counterparties/:id
   - All methods throw ApiClientError on non-ok response via parseApiError
   - Singleton: `export const counterpartiesApi = new CounterpartyApiClient()`
   - Convenience destructured exports
3. Create `src/lib/api/counterparties.test.ts` using node:test with mocked fetch:
   - getCounterparties → returns data+count, passes type/search params
   - getCounterparty → returns single record, throws on empty id, handles 404
   - createCounterparty → returns created record, handles 400 validation error
   - updateCounterparty → returns updated record, throws on empty id, handles 404
   - deleteCounterparty → returns message, handles 404
   - ApiClientError → correct properties
   - Singleton → instance check, convenience methods exist

Done when: TypeScript compiles with no errors and `npx tsx --test src/lib/api/counterparties.test.ts` passes all tests.

## Inputs

- `apps/web/src/lib/db/counterparties.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/api/shared.ts`
- `apps/web/src/lib/api/contacts.ts`
- `apps/web/src/lib/api/contacts.test.ts`

## Expected Output

- `apps/web/src/lib/api/counterparties.ts`
- `apps/web/src/lib/api/counterparties.test.ts`

## Verification

npx tsx --test src/lib/api/counterparties.test.ts

## Observability Impact

API client throws typed ApiClientError with statusCode, error, and message for every non-ok response. Empty/missing IDs are caught client-side before fetch (400 Validation failed).
