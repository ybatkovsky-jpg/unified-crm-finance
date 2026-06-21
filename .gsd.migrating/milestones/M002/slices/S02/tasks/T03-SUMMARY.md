---
id: T03
parent: S02
milestone: M002
key_files:
  - apps/web/src/app/crm/contacts/page.tsx
  - apps/web/src/lib/db/contacts.ts
  - apps/web/src/app/api/contacts/route.ts
  - apps/web/src/app/api/contacts/[id]/route.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-21T07:51:49.858Z
blocker_discovered: false
---

# T03: Built ContactListPage with type/status filters, loading/error/empty states, and row links to detail page; fixed Prisma type exports blocking build

**Built ContactListPage with type/status filters, loading/error/empty states, and row links to detail page; fixed Prisma type exports blocking build**

## What Happened

Created `apps/web/src/app/crm/contacts/page.tsx` as a client component with full async state management. The page fetches contacts via `contactsApi.getContacts()` with `useEffect` + `useState`, renders a filter bar (Card with two Selects for type: all|person|company and status: all|active|inactive) that triggers re-fetch on change. Displays contacts in a shadcn/ui Table with columns: Name (linked via next/link to `/crm/contacts/[id]` for S04), Type (Badge: Person/Company), Phone, Email, Status (Badge: Active/Inactive). Three async states handled: loading (spinner), empty ("No contacts found"), error (message + Retry button). Display name logic: company → companyName, person → lastName firstName.

During verification, two pre-existing type errors in S01 API routes were discovered and fixed: `Prisma.ContactCreateInput` and `Prisma.ContactUpdateInput` don't include scalar foreign keys (`sourceId`, `ownerId`) when relations are defined — they use `LeadSource`/`User` relation fields instead. Changed exports in `lib/db/contacts.ts` to use `Prisma.ContactUncheckedCreateInput` and `Prisma.ContactUncheckedUpdateInput` which include direct scalar FK fields. Also made `id` and `updatedAt` optional in `ContactCreateInput` since the repository generates them. Removed unused `ContactCreateInput` import from the POST route.

## Verification

1. `npx next build` passed — all routes compiled, no type errors:
   - Route (app): /, /_not-found, /api/contacts (ƒ), /api/contacts/[id] (ƒ), /api/health (ƒ), /crm/contacts (○ static)
2. Dev server on localhost:3000 serves /crm/contacts with HTTP 200
3. HTML output confirmed: Russian locale (lang="ru"), "Contacts" title, Type/Status filter selects, loading spinner with "Loading contacts..." text, all shadcn/ui components rendering correctly

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx next build` | 0 | pass | 22000ms |
| 2 | `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/crm/contacts` | 0 | pass | 200ms |

## Deviations

Fixed pre-existing type errors in S01 API routes: `Prisma.ContactCreateInput` lacks `sourceId`/`ownerId` (uses relation fields), changed to `Prisma.ContactUncheckedCreateInput`. Same for `ContactUpdateInput` → `ContactUncheckedUpdateInput`. Not part of T03 scope but blocked build verification.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/crm/contacts/page.tsx`
- `apps/web/src/lib/db/contacts.ts`
- `apps/web/src/app/api/contacts/route.ts`
- `apps/web/src/app/api/contacts/[id]/route.ts`
