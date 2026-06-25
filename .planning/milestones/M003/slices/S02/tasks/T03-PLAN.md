---
estimated_steps: 9
estimated_files: 1
skills_used: []
---

# T03: Add contact selector to CreateDealModal

Why: CreateDealModal creates deals with title/amount/currency/date but has no way to link a contact. For CRM purposes, most deals should be linked to a contact. The API accepts contactId (optional), so this is a gap in the UI.

Do:
1. Import contactsApi from @/lib/api/contacts. On modal open, fetch contacts via contactsApi.getContacts({}) — limited to first 50 results. Store in local state.
2. Add a search input (using the Input component) above or replacing a simple contact list. Filter contacts client-side by display name (case-insensitive substring match on name field). Debounce not strictly needed since filtering is client-side on already-fetched data.
3. Display filtered contacts in a scrollable list (max-h-40 overflow-y-auto) inside the modal. Each contact shows name and type badge. Click to select.
4. Add a "Контакт" Label section below the description field showing: a search input for filtering, a selected state (show contact name with an X button to clear), and the scrollable contact list (hidden when a contact is selected).
5. Add contactId to the DealCreateInput payload in handleSubmit. Make it optional.
6. Reset contact selection when modal closes or deal is created.

Done when: CreateDealModal has contact search; selecting a contact includes contactId in POST; deal created with contact shows contact name on kanban card; creating deal without contact still works.

## Inputs

- `apps/web/src/components/deals/create-deal-modal.tsx`
- `apps/web/src/lib/api/contacts.ts`
- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/components/deals/create-deal-modal.tsx`

## Verification

cd apps/web && npx tsc --noEmit
