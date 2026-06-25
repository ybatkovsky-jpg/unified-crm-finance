# S01: Contact CRUD API — UAT

**Milestone:** M002
**Written:** 2026-06-21T07:16:10.359Z

# UAT: Contact CRUD API — Slice S01

**UAT Type:** Backend API Verification

## Preconditions

1. Next.js dev server running: `cd apps/web && npx next dev`
2. SQLite dev database at `apps/web/prisma/dev.db` with all 6 migrations applied
3. ContactRepository wired and operational

## Test Steps

### 1. Create a Person Contact
**Action:** `POST /api/contacts` with body:
```json
{"type":"person","firstName":"Ivan","lastName":"Petrov","phone":"+79991234567","email":"ivan@example.com"}
```
**Expected:** HTTP 201, JSON body includes generated UUID, all fields match input, updatedAt is set, deletedAt is null.

### 2. Create a Company Contact
**Action:** `POST /api/contacts` with body:
```json
{"type":"company","companyName":"OOO Romashka","inn":"7700000001","phone":"+74951234567","email":"info@romashka.ru"}
```
**Expected:** HTTP 201, JSON body includes generated UUID, companyName and inn fields present, type=company.

### 3. List All Contacts
**Action:** `GET /api/contacts`
**Expected:** HTTP 200, JSON array containing both created contacts (and any pre-existing active contacts), soft-deleted contacts excluded.

### 4. Get Single Contact
**Action:** `GET /api/contacts/{id}` (using ID from step 1)
**Expected:** HTTP 200, JSON body matches the created person contact exactly.

### 5. Update Contact
**Action:** `PUT /api/contacts/{id}` with body:
```json
{"lastName":"Petrov-Production"}
```
**Expected:** HTTP 200, lastName updated, other fields unchanged.

### 6. Soft-Delete Contact
**Action:** `DELETE /api/contacts/{id}`
**Expected:** HTTP 200, deletedAt field set to current timestamp.

### 7. Verify Deleted Contact Excluded
**Action:** `GET /api/contacts`
**Expected:** HTTP 200, deleted contact no longer appears in array.

### 8. Validation — Missing Required Fields
**Action:** `POST /api/contacts` with body:
```json
{"type":"person","firstName":"Test"}
```
**Expected:** HTTP 400, error message indicates phone is required.

### 9. Validation — Company Missing companyName
**Action:** `POST /api/contacts` with body:
```json
{"type":"company","phone":"+79991234567"}
```
**Expected:** HTTP 400, error message indicates companyName is required.

### 10. 404 for Non-Existent ID
**Action:** `GET /api/contacts/00000000-0000-0000-0000-000000000000`
**Expected:** HTTP 404, error message indicates contact not found.

## Edge Cases Verified

- Person contacts require `firstName` and `phone`
- Company contacts require `companyName` and `phone`
- Unknown UUID returns 404 for GET, PUT, DELETE
- Soft-deleted contacts invisible in list and single get
- Database layer filters deletedAt on all read queries

## Not Proven By This UAT

- Performance under load (no load testing)
- PostgreSQL compatibility (dev uses SQLite — Prisma abstracts dialect differences)
- Auth/middleware integration (not in this slice scope)
- Contact duplicate detection (phone/email/inn — planned for later slice)
- Pagination beyond simple listing (GET /api/contacts returns all active records without limit/offset parameters in current implementation)
