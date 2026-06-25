---
estimated_steps: 19
estimated_files: 2
skills_used: []
---

# T05: Create UI detail page with history tabs

Why: The detail page is where users inspect a single counterparty and see its related history (purchase requests, invoices, deliveries). Must follow ContactDetailPage patterns (back nav, header card, data grid).

Do:
1. Create `src/app/procurement/counterparties/[id]/page.tsx`:
   - 'use client' with fetch on mount via counterpartiesApi.getCounterparty(id)
   - Loading/error/not-found states (match contacts pattern)
   - Back navigation: Link to /procurement/counterparties with ArrowLeftIcon
   - Header card: name (large), type Badge (supplier=secondary, customer=default), rating display (stars or number)
   - Details grid (2 columns): INN, KPP, Email, Phone, Contact Person, Address
   - Bank details card: Bank Name, Account, Kor Account, BIK
   - Notes section
   - Tabs: Details (default) | Purchase Requests | Invoices | Deliveries
   - Each history tab fetches from counterparty GET response (which includes relations) or separate API call
   - Empty state per tab: 'No purchase requests yet' etc.
2. Create `src/components/procurement/counterparty-history.tsx`:
   - Reusable table component accepting data array, columns config, empty message
   - Purchase Requests tab: table with request number, date, status
   - Invoices tab: table with invoice number, date, amount, status
   - Deliveries tab: table with delivery number, date, status

Done when: Page renders at /procurement/counterparties/[id], tabs switch content, loading/error states work, TypeScript compiles.

## Inputs

- `apps/web/src/lib/api/counterparties.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/app/crm/contacts/[id]/page.tsx`

## Expected Output

- `apps/web/src/app/procurement/counterparties/[id]/page.tsx`
- `apps/web/src/components/procurement/counterparty-history.tsx`

## Verification

npx tsc --noEmit

## Observability Impact

Detail page surfaces 404 state clearly ('Counterparty not found') with retry and back-navigation. Each history tab handles empty data gracefully with contextual empty messages. Console.error on fetch failures includes the counterparty ID.
