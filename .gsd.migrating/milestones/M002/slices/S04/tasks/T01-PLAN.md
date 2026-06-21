---
estimated_steps: 27
estimated_files: 1
skills_used: []
---

# T01: Contact Detail Page with Interactions

## Why
Build the integration slice that brings together Contact and Interaction APIs into a unified contact detail view, proving the S01-S03 data layer works end-to-end for users.

## Do
1. Create dynamic route directory `apps/web/src/app/crm/contacts/[id]/` and `page.tsx`
2. Implement "use client" component following S02 ContactListPage pattern:
   - useState for contact data, loading, error states
   - useEffect to fetch contact via contactsApi.getContact(id) on mount
   - Loading spinner, error state with Retry button
3. Render contact details header (read-only for MVP):
   - Type badge (Person/Company)
   - Name (firstName + lastName for person, companyName for company)
   - Phone, Email fields
   - Status badge (Active/Inactive)
   - Back navigation Link to /crm/contacts
4. Embed InteractionTimeline component with contactId prop
5. Embed InteractionForm component with contactId + mock authorId (hardcoded UUID)
6. Wire InteractionForm onSuccess callback to refetch interactions (trigger InteractionTimeline refresh)
7. Handle 404 for invalid contactId with error state

## Done when
- File `apps/web/src/app/crm/contacts/[id]/page.tsx` exists
- npx next build from apps/web compiles successfully
- Route /crm/contacts/[id] is registered in build output
- Page renders contact details header with type, name, phone, email, status
- InteractionTimeline displays chronological interactions or "No interactions yet"
- InteractionForm creates interaction via API and timeline refreshes
- Error states show with Retry buttons for contact fetch failures
- Back link navigates to /crm/contacts

## Inputs

- `apps/web/src/app/crm/contacts/page.tsx`
- `apps/web/src/components/crm/interaction-form.tsx`
- `apps/web/src/components/crm/interaction-timeline.tsx`
- `apps/web/src/lib/api/contacts.ts`
- `apps/web/src/lib/api/interactions.ts`
- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/app/crm/contacts/[id]/page.tsx`

## Verification

cd apps/web && npx next build (exit 0, route registered)

## Observability Impact

Console.error on contact fetch failure path; follows S02 pattern with ApiClientError handling
