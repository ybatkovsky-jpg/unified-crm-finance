# S04: Contact Detail & Integration — UAT

**Milestone:** M002
**Written:** 2026-06-21T09:18:54.916Z

# S04: Contact Detail & Integration — UAT

**Milestone:** M002
**Written:** 2026-06-21

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: The slice creates a user-facing page that requires runtime verification of data flow between Contact and Interaction APIs.

## Preconditions

1. Next.js dev server running at http://localhost:3000
2. SQLite database has at least one contact created
3. At least one interaction exists for that contact (can create via the add form)

## Smoke Test

Navigate to `/crm/contacts/[id]` for any existing contact ID — page loads without errors and displays contact information.

## Test Cases

### 1. View Contact Details (Person)

1. Create or find a contact with type=person
2. Navigate to `/crm/contacts/{id}`
3. **Expected:** Page displays name, email, phone in read-only fields

### 2. View Contact Details (Company)

1. Create or find a contact with type=company
2. Navigate to `/crm/contacts/{id}`
3. **Expected:** Page displays company name, INN, email, phone in read-only fields

### 3. View Interactions Timeline

1. Navigate to `/crm/contacts/{id}` for a contact with existing interactions
2. **Expected:** Timeline section shows all interactions for this contact in chronological order

### 4. Add New Interaction

1. Navigate to `/crm/contacts/{id}`
2. Fill in the add interaction form (type, direction, result, notes)
3. Click "Добавить" (Add)
4. **Expected:** 
   - Form submits successfully
   - New interaction appears in the timeline
   - Form clears for next entry

### 5. Invalid Contact ID

1. Navigate to `/crm/contacts/nonexistent-uuid`
2. **Expected:** Error handling or "not found" message

## Edge Cases

### Contact with No Interactions

1. Navigate to `/crm/contacts/{id}` for a contact with zero interactions
2. **Expected:** Timeline section shows empty state or "no interactions" message

### Non-existent Contact

1. Navigate to `/crm/contacts/00000000-0000-0000-0000-000000000000`
2. **Expected:** Appropriate error handling (404 or error message)

## Failure Signals

- Page fails to load (500 error)
- Contact data not displaying
- Interactions timeline not loading
- Add interaction form not submitting
- TypeError or network errors in browser console

## Not Proven By This UAT

- Duplicate detection logic (covered in S01)
- Interaction CRUD beyond creation (covered in S03)
- Bulk operations or complex filters
- Permission/authorization checks

## Notes for Tester

- The page uses UUID-based IDs — ensure you're using valid UUIDs from existing contacts
- If database is empty, create a test contact first via /crm/contacts page
- The form is in Russian (тип, направление, результат, заметки)
