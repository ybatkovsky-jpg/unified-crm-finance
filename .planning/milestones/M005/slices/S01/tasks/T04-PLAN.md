---
estimated_steps: 20
estimated_files: 2
skills_used: []
---

# T04: Create UI list page with filters and create modal

Why: The list page is the primary user-facing surface for managing counterparties. Must follow ContactListPage patterns (client component, loading/error/empty states, filter bar, table with links to detail).

Do:
1. Create `src/app/procurement/counterparties/page.tsx`:
   - 'use client' with useState/useEffect/useCallback
   - State: counterparties[], loading, error, typeFilter (supplier/all), searchQuery
   - fetchCounterparties → calls counterpartiesApi.getCounterparties({ type, search })
   - useEffect re-fetches on filter changes
   - Filter bar: type dropdown (All types / Supplier), search input with debounce
   - Table columns: Name (link to /procurement/counterparties/[id]), INN, Phone, Email, Rating (star display or '—'), Type (Badge: supplier=secondary)
   - Loading state: spinner + 'Loading counterparties...'
   - Error state: error message + Retry button + RefreshCwIcon
   - Empty state: 'No counterparties found' centered text
   - 'Create' button that opens a modal with CounterpartyForm
2. Create `src/components/procurement/counterparty-form.tsx`:
   - Dialog/Modal with form fields: name (required), type (select: supplier/customer), inn, kpp, email, phone, contactPerson, address, bankName, bankAccount, korAccount, bik, notes, rating (number input 1-5)
   - Bank details section visually grouped (bankName, bankAccount, korAccount, bik)
   - Submit calls counterpartiesApi.createCounterparty, onSuccess callback to refresh list + close modal
   - Validation: name required, type required
   - Uses shadcn/ui components: Dialog, Input, Select, Button, Label

Done when: Page renders at /procurement/counterparties, create modal opens/closes, filter dropdown works, TypeScript compiles.

## Inputs

- `apps/web/src/lib/api/counterparties.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/api/shared.ts`
- `apps/web/src/app/crm/contacts/page.tsx`

## Expected Output

- `apps/web/src/app/procurement/counterparties/page.tsx`
- `apps/web/src/components/procurement/counterparty-form.tsx`

## Verification

npx tsc --noEmit

## Observability Impact

UI surfaces API errors via error state with message text and retry button. Loading/empty/error states provide clear signal about current page state. Console.error on fetch failures for debugging.
