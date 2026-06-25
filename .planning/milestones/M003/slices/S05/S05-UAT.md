# S05: S05 — UAT

**Milestone:** M009
**Written:** 2026-06-21T13:13:39.373Z

# UAT: Contracts Module

## UAT Type
Functional UI Testing

## Preconditions
- Dev server running on localhost:3000
- Database seeded with test contracts
- User authenticated

## Test Cases

### TC1: View Contracts List
1. Navigate to `/contracts`
2. **Expected:** Table displays with columns Number, Title, Contact, Amount, Dates, Status
3. **Expected:** Status filter dropdown visible (all, draft, active, expired, terminated)
4. **Expected:** Contact filter dropdown populated with contacts

### TC2: Filter Contracts by Status
1. On `/contracts` page, select "Active" from status filter
2. **Expected:** Table shows only active contracts
3. **Expected:** API timing logged to console

### TC3: Filter Contracts by Contact
1. On `/contracts` page, select a contact from contact filter
2. **Expected:** Table shows only contracts for selected contact
3. **Expected:** Contact name displayed correctly (company or "LastName FirstName")

### TC4: View Contract Details
1. Click on any contract row in the table
2. **Expected:** Navigate to `/contracts/[id]` detail page
3. **Expected:** Four tabs visible: Details, Versions, Signers, Related

### TC5: Edit Contract Details
1. On detail page, click Details tab
2. Click "Edit" button
3. Modify title or amount
4. Click "Save"
5. **Expected:** Changes saved, form exits edit mode

### TC6: Add Contract Version
1. On detail page, click Versions tab
2. Click "Add Version" button
3. **Expected:** Modal opens with version form
4. Fill in Markdown content
5. Submit
6. **Expected:** New version appears in versions list

### TC7: Add Contract Signer
1. On detail page, click Signers tab
2. Click "Add Signer" button
3. **Expected:** Modal opens with signer form
4. Fill in name, position
5. Submit
6. **Expected:** New signer appears in signers table

### TC8: View Related Entities
1. On detail page, click Related tab
2. **Expected:** Contact link displayed (navigates to contact detail)
3. **Expected:** Deal link displayed if contract converted from deal

## Edge Cases
- Empty contracts list shows "No contracts found" message
- API errors display retry button
- Invalid contract ID shows not found state
- Filters work in combination (status + contact)

## Not Proven By This UAT
- Actual contract creation (form submission to API)
- Contract deletion flow
- PDF generation for versions
- Email notifications on signing
