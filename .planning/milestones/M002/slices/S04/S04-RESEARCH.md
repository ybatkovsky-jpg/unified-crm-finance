# S04: Contact Detail & Integration — Research

**Date:** 2026-06-21

## Summary

S04 is a low-risk integration slice that brings together Contact and Interaction APIs from S01 and S03 into a unified contact detail page at `/crm/contacts/[id]`. The implementation leverages existing patterns: API clients (contactsApi, interactionsApi), UI components (shadcn/ui), and data-fetching patterns from S02 Contact List page. The page requires a dynamic route segment in Next.js App Router, server-side contact data fetch for SSR, and client-side interactions timeline fetch. No new API endpoints are needed—GET /api/contacts/[id] and GET /api/contacts/[id]/interactions already exist. For MVP, authorId for interactions will be a mock UUID since auth is not yet wired.

## Recommendation

Build a single-page React client component at `apps/web/src/app/crm/contacts/[id]/page.tsx` with two sections: contact details header (read-only for MVP) and interactions timeline with add interaction form. Follow the exact patterns from S02 Contact List: "use client" directive, useState/useEffect for data fetching, loading/error states with Retry button, contactsApi.getContact() and interactionsApi.getContactInteractions() for data. Reuse InteractionForm and InteractionTimeline components from S03 unchanged. Mock authorId as a hardcoded UUID since M001 auth is not runtime-integrated yet. This is the simplest path to a working contact detail page that proves integration between S01 and S03 deliverables.

## Implementation Landscape

### Key Files

- `apps/web/src/app/crm/contacts/[id]/page.tsx` — **NEW** Contact detail page, dynamic route with id param
- `apps/web/src/app/crm/contacts/page.tsx` — **REFERENCE** Copy data-fetching pattern (useState/useEffect, loading/error states)
- `apps/web/src/components/crm/interaction-form.tsx` — **REUSE** Existing from S03, pass contactId + mock authorId
- `apps/web/src/components/crm/interaction-timeline.tsx` — **REUSE** Existing from S03, pass contactId
- `apps/web/src/lib/api/contacts.ts` — **USE** contactsApi.getContact(id) for contact data
- `apps/web/src/lib/api/interactions.ts` — **USE** interactionsApi.getContactInteractions(contactId) for timeline

### Build Order

1. Create dynamic route directory and page component at `src/app/crm/contacts/[id]/page.tsx`
2. Implement contact data fetch on mount using contactsApi.getContact(id) with loading/error states
3. Render contact details header: type badge, name/company name, phone, email, status badge
4. Embed InteractionTimeline with contactId prop for interactions list
5. Embed InteractionForm with contactId + mock authorId props for creating new interactions
6. Add back-navigation link to `/crm/contacts`
7. Verify build with `npx next build` from apps/web directory (per MEM028)

### Verification Approach

**Static checks:**
- File exists: `apps/web/src/app/crm/contacts/[id]/page.tsx`
- `npx next build` from apps/web compiles successfully, route registered as /crm/contacts/[id]

**Runtime checks:**
- Dev server starts: `cd apps/web && npx next dev`
- HTTP GET /crm/contacts/{valid-id} returns 200 with contact name, phone, email, interactions
- HTTP GET /crm/contacts/{invalid-id} (UUID not in DB) shows error state with message
- "Add Interaction" button opens dialog, form submission creates interaction via API
- Timeline refreshes after new interaction added (onSuccess callback)

**Observable behaviors:**
- Contact details header shows: Type badge (Person/Company), Name (or companyName), Phone, Email, Status badge
- Interactions section shows chronological timeline or "No interactions yet" empty state
- Clicking "Add Interaction" opens InteractionForm dialog
- After creating interaction, timeline updates to show new entry
- Error states display with Retry buttons for both contact and interactions fetch failures

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Contact data fetching | `contactsApi.getContact(id)` from S01 | Already typed, handles 404/network errors, returns ContactData |
| Interactions timeline | `InteractionTimeline` component from S03 | Handles loading/error/empty states, chronological display, icon mapping |
| Add interaction form | `InteractionForm` component from S03 | Validates type/direction/subject, creates via interactionsApi, onSuccess callback |
| Loading/error states | Pattern from ContactListPage S02 | Proven pattern with spinner, error message + Retry button, empty state |
| Route structure | Next.js App Router `[id]` segment | Standard pattern for dynamic routes, matches S02 /crm/contacts structure |

## Constraints

- **No new API endpoints needed** — GET /api/contacts/[id] and GET /api/contacts/[id]/interactions exist from S01/S03
- **Auth not ready** — authorId for interactions must be mocked as hardcoded UUID (e.g., "00000000-0000-0000-0000-000000000001")
- **No edit functionality** — Contact detail page is read-only for MVP; update/delete UI deferred to future work
- **Deals/Contracts/Projects tabs** — Not implemented in S04; these require M003+ data layers
- **Build from apps/web** — Per MEM028, must run `npx next build` from apps/web, not project root

## Common Pitfalls

- **Dynamic route naming** — Must be `[id]` directory, not `[contactId]` or other names, to match the S02 list page links
- **useEffect dependency on id** — If navigating between contacts, need id in dependency array to refetch on change
- **Missing authorId** — InteractionForm requires authorId prop; mock it or component throws validation error
- **Not hardening against 404** — If contactId is invalid, show error state, not blank page or console crash
- **onSuccess not wired** — Creating interaction won't refresh timeline unless onSuccess callback refetches interactions

## Open Risks

- **Low risk** — This is pure integration work; all dependencies (APIs, components) exist and are tested
- **Potential issue** — If interactions API endpoint `/api/contacts/[id]/interactions` returns unexpected shape, timeline may fail to render (verified working in S03)
- **Navigation** — Back button from detail to list works via Link, but browser back button depends on Next.js routing (standard behavior)

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Next.js App Router | `apps/web` local pattern | n/a — using established patterns from S02 |
| shadcn/ui | components.json initialized | n/a — already installed from S02 |
| lucide-react | icons installed | n/a — already used in S02/S03 |

## Sources

None — this is light research based on existing codebase patterns and S01/S02/S03 deliverables.
