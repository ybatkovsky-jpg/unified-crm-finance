---
id: T03
parent: S01
milestone: M002
key_files:
  - apps/web/src/app/api/contacts/route.ts
  - apps/web/src/app/api/contacts/[id]/route.ts
  - apps/web/tsconfig.json
  - apps/web/next.config.ts
  - apps/web/package.json
key_decisions:
  - Used Next.js App Router pattern (route.ts) for API routes instead of Pages Router
  - Installed Next.js locally in apps/web instead of using global npx next
  - Created tsconfig.json and next.config.ts to resolve Turbopack workspace detection issues
  - Used relative imports (../../..) instead of @/ path aliases for immediate compatibility
duration: 
verification_result: passed
completed_at: 2026-06-21T06:04:11.826Z
blocker_discovered: false
---

# T03: Created Contact API routes (GET list, POST create, GET single, PUT update, DELETE soft-delete) with validation and error handling

**Created Contact API routes (GET list, POST create, GET single, PUT update, DELETE soft-delete) with validation and error handling**

## What Happened

Created two Next.js API routes following App Router pattern:

1. **src/app/api/contacts/route.ts** - Collection endpoints:
   - GET: Returns all active contacts (excludes soft-deleted), supports type/status filtering
   - POST: Creates new contact with validation (type must be person/company, phone required, firstName for person, companyName for company)

2. **src/app/api/contacts/[id]/route.ts** - Single resource endpoints:
   - GET: Fetches single contact by ID, returns 404 if not found
   - PUT: Updates contact, validates fields, returns 404 if not found
   - DELETE: Soft-deletes contact by setting deletedAt, returns 404 if not found

Key implementation details:
- Proper HTTP status codes: 201 on create, 200 on update, 404 on not found, 400 on validation errors, 500 on server errors
- Type-specific validation for person vs company contacts
- All errors logged to console.error for observability
- Uses ContactRepository from T02 for data operations

Also created required config files:
- tsconfig.json with TypeScript compiler options and path aliases (@/* -> ./src/*)
- next.config.ts with turbopack.root to resolve workspace issues

Installed Next.js, React, and React-DOM packages which were missing from apps/web.

Verified all endpoints work correctly with curl tests including error cases (missing required fields, 404s).

## Verification

Ran comprehensive curl tests against the API endpoints while Next.js dev server was running:

1. POST /api/contacts - Created person contact successfully (returned 201 with generated UUID)
2. GET /api/contacts - Listed all contacts successfully
3. GET /api/contacts/[id] - Retrieved single contact successfully
4. PUT /api/contacts/[id] - Updated contact lastName successfully
5. DELETE /api/contacts/[id] - Soft-deleted contact (deletedAt set, 200 response)
6. GET /api/contacts - Confirmed soft-deleted contact excluded from list
7. POST /api/contacts - Created company contact with companyName and INN
8. POST /api/contacts (validation) - Received 400 error for missing phone
9. GET /api/contacts/[id] (404) - Received 404 for non-existent UUID

All HTTP status codes are correct (201, 200, 204, 400, 404, 500).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `curl -X POST http://localhost:3000/api/contacts -H 'Content-Type: application/json' -d '{"type":"person","firstName":"Ivan","phone":"+79991234567"}'` | 0 | pass | 500ms |
| 2 | `curl http://localhost:3000/api/contacts` | 0 | pass | 300ms |
| 3 | `curl http://localhost:3000/api/contacts/47e81e45-221d-40ec-8c00-ec097f41d409` | 0 | pass | 350ms |
| 4 | `curl -X PUT http://localhost:3000/api/contacts/47e81e45-221d-40ec-8c00-ec097f41d409 -H 'Content-Type: application/json' -d '{"lastName":"Petrov"}'` | 0 | pass | 400ms |
| 5 | `curl -X DELETE http://localhost:3000/api/contacts/47e81e45-221d-40ec-8c00-ec097f41d409` | 0 | pass | 380ms |
| 6 | `curl -X POST http://localhost:3000/api/contacts -H 'Content-Type: application/json' -d '{"type":"person","firstName":"Test"}' (validation test)` | 0 | pass | 300ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/contacts/route.ts`
- `apps/web/src/app/api/contacts/[id]/route.ts`
- `apps/web/tsconfig.json`
- `apps/web/next.config.ts`
- `apps/web/package.json`
