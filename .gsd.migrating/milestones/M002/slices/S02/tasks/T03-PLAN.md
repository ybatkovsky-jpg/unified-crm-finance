---
estimated_steps: 19
estimated_files: 1
skills_used: []
---

# T03: Build Contact List page with type and status filters

## Why
The slice goal is a functional contact list at `/crm/contacts` with filterable table. This is the primary deliverable. Consumes the ContactApiClient from S01 and shadcn/ui components from T01.

## Do
1. Create `src/app/crm/contacts/page.tsx` as a client component (`'use client'`)
2. Use `contactsApi.getContacts()` from `@/lib/api/contacts` for data fetching with `useEffect` + `useState`
3. Manage filter state: `type` (all | person | company) and `status` (all | active | inactive) as `useState`
4. On filter change, re-fetch contacts with updated `ContactListParams`
5. Render shadcn/ui `Table` with columns: Name (firstName+lastName or companyName), Type (Badge: person/company), Phone, Email, Status (Badge: active/inactive)
6. Add filter bar above the table with shadcn/ui `Select` for type filter and status filter, wrapped in a `Card`
7. Add loading state: show skeleton or spinner while fetch is in progress
8. Add empty state: "No contacts found" message when `data.length === 0`
9. Add error state: error message with "Retry" button that re-triggers fetch
10. Each table row: wrap the Name cell in `<Link href={/crm/contacts/${contact.id}}>` from `next/link` (forward-compatible with S04)
11. Display Name logic: for `type=person` → `{lastName} {firstName}`, for `type=company` → `{companyName}`

## Done when
- `npx next build` succeeds (page compiles, all imports resolve)
- Page handles 3 states: loading (fetch in progress), empty (no contacts), error (API failure with retry)
- Filter Selects change query params and trigger re-fetch via `getContacts({ type, status })`
- Table rows link to `/crm/contacts/[id]` for navigation to detail page (S04)

## Inputs

- `apps/web/src/lib/api/contacts.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/components/ui/table.tsx`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/select.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/lib/utils.ts`
- `apps/web/src/app/layout.tsx`

## Expected Output

- `apps/web/src/app/crm/contacts/page.tsx`

## Verification

npx next build
