# S02: Contact List UI — UAT

**Milestone:** M002
**Written:** 2026-06-21T08:00:32.676Z

## UAT Type
Integration

## Preconditions
1. Dev server running: `cd apps/web && npm run dev`
2. Database has at least one contact (seeded or created via POST /api/contacts)
3. Browser open at http://localhost:3000

## Steps

### 1. Root redirect
1. Navigate to http://localhost:3000/
2. **Expected:** Browser redirects to /crm/contacts (307)

### 2. Contact list loads
1. Navigate to http://localhost:3000/crm/contacts
2. **Expected:** Page title is "Contacts" (h1). Loading spinner visible briefly. Contacts appear in table with columns: Name, Type, Phone, Email, Status. Names are hyperlinks to /crm/contacts/[id].

### 3. Type filter
1. Select "Person" from Type dropdown
2. **Expected:** Table refreshes, only contacts with type=person shown. Type badge shows "Person" for all rows.
3. Select "Company" from Type dropdown
4. **Expected:** Table refreshes, only contacts with type=company shown. Type badge shows "Company" for all rows.
5. Select "All types"
6. **Expected:** All contacts return.

### 4. Status filter
1. Select "Active" from Status dropdown
2. **Expected:** Only active contacts shown. Status badge shows "Active".
3. Select "Inactive"
4. **Expected:** Only inactive contacts shown. Status badge shows "Inactive".

### 5. Combined filters
1. Set Type = "Company", Status = "Active"
2. **Expected:** Only active companies shown.

### 6. Empty state
1. Set filters that match no contacts (e.g. filter by a type/status combination with zero results)
2. **Expected:** "No contacts found" message displayed.

### 7. Error state
1. Stop the API server (or block /api/contacts in dev tools)
2. Refresh the page
3. **Expected:** Error message displayed with "Retry" button. Clicking Retry re-fetches.

### 8. Row link
1. Click on a contact name link
2. **Expected:** Browser navigates to /crm/contacts/[id] (page may show 404 if S04 not yet built — this is expected and forward-compatible)

## Edge Cases
- **Empty table**: Page handles zero rows gracefully with "No contacts found" message
- **Network failure**: Error message with Retry button, not a blank page
- **Fast filter switching**: Each filter change triggers a new fetch; previous in-flight requests are implicitly replaced by React state update
- **Display name**: Company contacts show companyName; person contacts show lastName + firstName; missing names show em dash

## Not Proven By This UAT
- Contact detail page (part of S04)
- Contact creation/edit UI (not in scope)
- Interactions display (part of S04)
- Authentication/auth checks on /crm/contacts page
- Pagination for large contact lists
- Mobile responsiveness testing
