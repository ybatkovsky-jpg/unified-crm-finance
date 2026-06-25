---
id: T04
parent: S01
milestone: M002
key_files:
  - apps/web/src/lib/api/contacts.ts
  - apps/web/src/lib/api/types.ts
  - apps/web/src/lib/api/contacts.test.ts
key_decisions:
  - Removed window.location reference from URL builder for Node.js/test environment compatibility
  - Used node:test native test runner with assert module instead of external testing library
  - Exposed statusCode, error, and message as separate public properties on ApiClientError for structured error handling
duration: 
verification_result: passed
completed_at: 2026-06-21T06:34:54.089Z
blocker_discovered: false
---

# T04: Created TypeScript API client (lib/api/contacts.ts) with typed CRUD methods for Contact API, types module (lib/api/types.ts), and 25 passing tests

**Created TypeScript API client (lib/api/contacts.ts) with typed CRUD methods for Contact API, types module (lib/api/types.ts), and 25 passing tests**

## What Happened

Created a complete TypeScript client for the Contact API with the following components:

1. **lib/api/types.ts** - Request/response types matching API route contracts:
   - ContactData, ApiError, ApiResponse, ApiListResponse
   - ContactFilters, PaginationOptions, ContactListParams
   - ContactCreateInput, ContactUpdateInput
   - ApiClientConfig

2. **lib/api/contacts.ts** - ContactApiClient class with:
   - getContacts(filter, pagination) - Lists contacts with type/status filters
   - getContact(id) - Fetches single contact by ID
   - createContact(data) - Creates new contact with validation
   - updateContact(id, data) - Partial update of existing contact
   - deleteContact(id) - Soft-delete with confirmation message
   - ApiClientError class for typed error handling
   - Default singleton instance (contactsApi) with convenience exports
   - Fetch error logging via console.error

3. **lib/api/contacts.test.ts** - Comprehensive test suite:
   - 25 tests covering all CRUD operations, error cases, URL building
   - Mocked fetch implementation for isolated testing
   - Uses node:test with assert for proper Node.js compatibility
   - All tests passing

Key implementation decisions:
- Removed window.location dependency for Node.js compatibility
- Used standard node:test/assert instead of Jest-like expectations
- Singleton pattern exported for easy application-wide use
- Error class exposes statusCode, error type, and message separately
- Content-Type validation on all responses

## Verification

Ran test suite with tsx --test: 25/25 tests passed.
Verified all CRUD methods (getContacts, getContact, createContact, updateContact, deleteContact) with mocked fetch.
Confirmed error handling for validation errors (missing firstName/companyName/phone) and 404 responses.
Verified query parameter building for type/status filters.
Checked request methods (POST, PUT, DELETE) are correctly set.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd D:/CLAUDE/Project/unified-crm-finance/apps/web && npx tsx --test src/lib/api/contacts.test.ts` | 0 | pass | 526ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/api/contacts.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/api/contacts.test.ts`
