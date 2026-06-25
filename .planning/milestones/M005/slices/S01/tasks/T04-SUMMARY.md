---
id: T04
parent: S01
milestone: M005
key_files:
  - apps/web/src/app/procurement/counterparties/page.tsx
  - apps/web/src/components/procurement/counterparty-form.tsx
key_decisions:
  - Followed ContactListPage pattern exactly for consistent UI/UX across CRM and Procurement modules
  - Used Base UI Select's onValueChange with a null-guard wrapper to satisfy type requirements
  - Used 300ms debounce for search input to avoid excessive API calls
  - Grouped bank details in a bordered visual section for better form organization
duration: 
verification_result: untested
completed_at: 2026-06-23T09:58:43.170Z
blocker_discovered: false
---

# T04: Created counterparty list page with filter bar, table, loading/error/empty states, and a create modal form

**Created counterparty list page with filter bar, table, loading/error/empty states, and a create modal form**

## What Happened

Created two new files following the ContactListPage pattern from CRM contacts. The list page at apps/web/src/app/procurement/counterparties/page.tsx includes a type filter dropdown (All types/Supplier), search input with 300ms debounce, a table with columns for Name (linked to detail page), INN, Phone, Email, Rating (star display), and Type badge. It handles loading spinner, error state with retry button, and empty state. A Create button opens the CounterpartyForm dialog modal. The counterparty form at apps/web/src/components/procurement/counterparty-form.tsx is a dialog modal with all CounterpartyData fields including name (required), type (select: supplier/customer, required), inn, kpp, email, phone, contactPerson, address, bank details grouped in a bordered section (bankName, bankAccount, korAccount, bik), notes (textarea), and rating (number input 1-5). Form submission calls counterpartiesApi.createCounterparty, validates required fields, and calls onSuccess callback to refresh the list and close the modal. The Select onValueChange handler was wrapped to handle Base UI's string | null type.

## Verification

npx tsc --noEmit passes with zero errors in our new files. All existing errors are pre-existing in other files (test files, deals, projects).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/procurement/counterparties/page.tsx`
- `apps/web/src/components/procurement/counterparty-form.tsx`
