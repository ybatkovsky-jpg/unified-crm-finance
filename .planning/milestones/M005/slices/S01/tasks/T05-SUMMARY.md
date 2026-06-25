---
id: T05
parent: S01
milestone: M005
key_files:
  - apps/web/src/app/procurement/counterparties/[id]/page.tsx
  - apps/web/src/components/procurement/counterparty-history.tsx
key_decisions:
  - Used Record<string, unknown>[] for generic data prop in CounterpartyHistory for flexibility with future typed data
  - Used custom Tabs component API (value/onValueChange pattern) matching the project's @/components/ui/tabs implementation
  - Used placeholder empty arrays for purchase requests, invoices, and deliveries tabs since API does not yet return embedded relations
duration: 
verification_result: untested
completed_at: 2026-06-23T09:58:37.279Z
blocker_discovered: false
---

# T05: Created counterparty detail page with header card, details grid, bank details, notes, and history tabs, plus reusable CounterpartyHistory table component

**Created counterparty detail page with header card, details grid, bank details, notes, and history tabs, plus reusable CounterpartyHistory table component**

## What Happened

Created two files for T05. The detail page (apps/web/src/app/procurement/counterparties/[id]/page.tsx) follows the ContactDetailPage pattern exactly: 'use client' with fetch via counterpartiesApi.getCounterparty(id), loading spinner state, error card with retry + back navigation, and the main UI with a header card (name, type Badge with supplier=customer/secondary=default, star rating), 2-column details grid (INN, KPP, Email, Phone, Contact Person, Address), conditional bank details card, conditional notes section, and four tabs (Details, Purchase Requests, Invoices, Deliveries) using the custom Tabs component from @/components/ui/tabs. History tabs use placeholder empty arrays with the CounterpartyHistory component showing appropriate empty messages. The reusable CounterpartyHistory component (apps/web/src/components/procurement/counterparty-history.tsx) renders a Table from shadcn/ui with configurable columns (key, header, optional render function) and shows a centered emptyMessage when data is empty. Both files pass tsc --noEmit with zero new errors.

## Verification

Verified: npx tsc --noEmit passes with no errors in the new files. File contents match all requirements from the task spec.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/procurement/counterparties/[id]/page.tsx`
- `apps/web/src/components/procurement/counterparty-history.tsx`
