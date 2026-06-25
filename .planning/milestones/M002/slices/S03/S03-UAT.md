# S03: S03: Interactions API & UI — UAT

**Milestone:** M002
**Written:** 2026-06-21T09:12:41.199Z

# UAT: Interactions API & UI

## Preconditions
- Prisma SQLite database initialized with contacts schema
- Next.js dev server running (`npx next dev`)
- At least one Contact record exists in database

## Test Steps

### 1. Create Interaction via API
```bash
curl -X POST http://localhost:3000/api/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "<existing-contact-id>",
    "type": "call",
    "direction": "outbound",
    "subject": "Follow-up call",
    "content": "Discussed Q3 proposal",
    "scheduledAt": "2024-06-21T10:00:00Z",
    "completedAt": "2024-06-21T10:15:00Z"
  }'
```
**Expected**: HTTP 201 with created interaction JSON including generated `id` and `createdAt`

### 2. Retrieve Contact Interactions Timeline
```bash
curl http://localhost:3000/api/contacts/<contact-id>/interactions
```
**Expected**: HTTP 200 with array of interactions in chronological order (newest first)

### 3. Get Single Interaction
```bash
curl http://localhost:3000/api/interactions/<interaction-id>
```
**Expected**: HTTP 200 with interaction details or 404 if not found

### 4. Update Interaction
```bash
curl -X PUT http://localhost:3000/api/interactions/<interaction-id> \
  -H "Content-Type: application/json" \
  -d '{"subject": "Updated subject"}'
```
**Expected**: HTTP 200 with updated interaction

### 5. List with Filters
```bash
curl "http://localhost:3000/api/interactions?type=call&contactId=<contact-id>"
```
**Expected**: HTTP 200 with filtered results

### 6. Delete Interaction
```bash
curl -X DELETE http://localhost:3000/api/interactions/<interaction-id>
```
**Expected**: HTTP 200 with success message; subsequent GET returns 404

## Edge Cases Tested
- Missing `contactId` → 400 validation error
- Invalid `type` → 400 validation error
- Non-existent ID → 404 Not Found
- Cascade delete: deleting contact removes associated interactions

## UAT Type
Functional API verification with end-to-end data persistence

## Not Proven By This UAT
- UI rendering in browser (S04 will integrate components into Contact Detail page)
- Authentication/authorization (M001 NextAuth integration pending)
- Real-time updates or webhook notifications
