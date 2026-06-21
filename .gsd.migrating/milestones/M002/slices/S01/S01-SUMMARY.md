---
id: S01
parent: M002
milestone: M002
provides:
  - POST /api/contacts creates Contact record (person or company)
  - GET /api/contacts returns filtered list of active contacts
  - GET /api/contacts/[id] returns single contact or 404
  - PUT /api/contacts/[id] updates contact fields
  - DELETE /api/contacts/[id] soft-deletes contact
  - PrismaClient singleton in src/lib/db/prisma.ts
  - ContactRepository CRUD wrapper in src/lib/db/contacts.ts
  - Typed ContactApiClient in src/lib/api/contacts.ts
requires:
  []
affects:
  - S02 Contact List UI (consumes GET /api/contacts)
  - S03 Interactions API (consumes contact API, interactions reference contactId)
  - M002 roadmap (S01 is foundation for all subsequent CRM slices)
key_files:
  - apps/web/prisma/schema.prisma
  - apps/web/prisma/migrations/20260621042334_shared_and_crm/migration.sql
  - apps/web/src/lib/db/prisma.ts
  - apps/web/src/lib/db/contacts.ts
  - apps/web/src/app/api/contacts/route.ts
  - apps/web/src/app/api/contacts/[id]/route.ts
  - apps/web/src/lib/api/contacts.ts
  - apps/web/src/lib/api/types.ts
  - apps/web/tsconfig.json
  - apps/web/next.config.ts
key_decisions:
  - Used Next.js App Router pattern (route.ts exports GET/POST/PUT/DELETE) instead of Pages Router API routes
  - Placed source files under apps/web/src/ with tsconfig baseUrl ./src and @/* path aliases
  - ContactRepository DAO pattern with manual UUID (randomUUID) and manual updatedAt on create
  - Used node:test native test runner via tsx --test instead of Jest/Vitest
  - Soft-delete via deletedAt timestamp rather than physical row deletion
  - Installed Next.js locally in apps/web to resolve Turbopack workspace detection issues
  - ApiClientError class with structured statusCode/error/message for typed error handling
patterns_established:
  - Next.js App Router API route.ts pattern under src/app/api/
  - ContactRepository DAO wrapper around Prisma singleton
  - Singleton PrismaClient export from src/lib/db/prisma.ts
  - src/ directory convention for all app source code
  - Soft-delete pattern with deletedAt timestamp filtered in all queries
  - TypeScript API client class with singleton instance and convenience function exports
  - Mocked fetch in tests using node:test framework
observability_surfaces:
  - console.error logging on all API route error paths
  - console.error logging on API client fetch failures
  - Prisma query logging enabled in development
  - Structured error responses with error type and message
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-06-21T07:16:10.353Z
blocker_discovered: false
---

# S01: Contact CRUD API

**Created complete Contact CRUD API with Prisma-backed Next.js API Routes, ContactRepository data layer, and typed TypeScript API client — 6 Prisma migrations applied, 34 tests passing (9 DB + 25 API client), all CRUD endpoints verified via curl.**

## What Happened

## T01: Prisma Migrations for CRM Models

Verified and applied 6 Prisma migrations including CRM models (Contact, LeadSource, Interaction, Lead) to the SQLite dev database. The Contact model uses a unified type=person|company design. Tags field uses Json type with @default("[]") for SQLite compatibility. All 42-entity schema validated with `npx prisma validate`.

## T02: ContactRepository Data Layer

Created PrismaClient singleton (`apps/web/src/lib/db/prisma.ts`) and ContactRepository (`apps/web/src/lib/db/contacts.ts`) with full CRUD + softDelete. Key decisions: uses `randomUUID()` from node:crypto for ID generation (no @default in schema), sets `updatedAt` manually on create (no @updatedAt directive), filters out soft-deleted records (deletedAt != null) on all read queries. 9 tests pass.

## T03: Next.js API Routes

Created two App Router route.ts files:
- `src/app/api/contacts/route.ts` — GET (list with type/status filters), POST (create with validation)
- `src/app/api/contacts/[id]/route.ts` — GET, PUT, DELETE (soft-delete)

Installed Next.js, React, React-DOM locally in apps/web. Created tsconfig.json and next.config.ts with Turbopack workspace resolution. All endpoints return correct HTTP status codes (201, 200, 204, 400, 404, 500) with validation for person vs company contacts. Verified via curl, all 9 test cases pass.

## T04: TypeScript API Client

Created `ContactApiClient` class in `apps/web/src/lib/api/contacts.ts` with getContacts, getContact, createContact, updateContact, deleteContact methods. Types defined in `apps/web/src/lib/api/types.ts`. Includes `ApiClientError` with structured error properties (statusCode, error, message). Singleton instance exported as `contactsApi`. 25 tests pass using mocked fetch with node:test.

## Verification

## Slice-Level Verification (fresh re-execution)

| # | Check | Result |
|---|-------|--------|
| 1 | npx prisma validate | PASS — schema is valid |
| 2 | npx prisma migrate status | PASS — 6 migrations applied, database up to date |
| 3 | npx tsx --test src/lib/db/contacts.test.ts | PASS — 9/9 tests |
| 4 | npx tsx --test src/lib/api/contacts.test.ts | PASS — 25/25 tests |

## Per-Task Verification (from summaries)

T01: `npx prisma migrate status` — 6 migrations, DB up-to-date; `npx prisma validate` — valid.
T02: 9 tests pass — create, findUnique, findByEmail, findMany, update, softDelete, existsByEmail, count, cleanup.
T03: 9 curl tests pass — POST person, GET list, GET single, PUT update, DELETE soft-delete, verify exclusion, POST company, 400 validation, 404 not-found.
T04: 25 tests pass — getContacts (5), getContact (4), createContact (5), updateContact (4), deleteContact (4), ApiClientError (1), singleton (2).

## Requirements Advanced

- R010 — Delivered core CRM data layer — Contact model with CRUD API, Prisma migrations for Contact/LeadSource/Interaction/Lead tables, ContactRepository for data access, typed API client. Foundation for remaining M002 slices.

## Requirements Validated

None.

## New Requirements Surfaced

- Duplicate detection is planned but not yet implemented — GET /api/contacts returns all active contacts without dedup checks

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

Source files placed in apps/web/src/lib/db/ instead of apps/web/lib/db/ (as originally planned) because Prisma client generates in apps/web/node_modules and imports from root-level lib/ would fail. API routes in apps/web/src/app/api/ (Next.js convention). Next.js installed locally in apps/web instead of using global binary.

## Known Limitations

Pagination not yet implemented (GET /api/contacts returns all active contacts without limit/offset). No duplicate detection (phone, email, INN). No auth middleware — all API routes are public in MVP. SQLite used for dev; PostgreSQL compatibility not yet verified at runtime.

## Follow-ups

Add pagination to GET /api/contacts (limit/offset query params). Implement duplicate contact detection (by phone, email, INN). Add Prisma query logging in production-ready format. Consider PostgreSQL integration test in CI. Wire up auth middleware when M001 auth is ready.

## Files Created/Modified

None.
