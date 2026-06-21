---
id: T02
parent: S01
milestone: M002
key_files:
  - apps/web/src/lib/db/prisma.ts
  - apps/web/src/lib/db/contacts.ts
  - apps/web/src/lib/db/contacts.test.ts
key_decisions:
  - Used node:crypto randomUUID() for ID generation instead of external library
  - Set updatedAt on create since schema lacks @updatedAt directive
  - Placed files in apps/web/src/lib/db/ because Prisma client generates there
duration: 
verification_result: passed
completed_at: 2026-06-21T05:50:51.275Z
blocker_discovered: false
---

# T02: Created PrismaClient singleton (apps/web/src/lib/db/prisma.ts) and ContactRepository with CRUD+softDelete (apps/web/src/lib/db/contacts.ts). All 9 tests pass.

**Created PrismaClient singleton (apps/web/src/lib/db/prisma.ts) and ContactRepository with CRUD+softDelete (apps/web/src/lib/db/contacts.ts). All 9 tests pass.**

## What Happened

Created two files in apps/web/src/lib/db/:

1. prisma.ts - PrismaClient singleton with hot-reload protection and development query logging
2. contacts.ts - ContactRepository class with findMany, findUnique, findByEmail/Phone/Inn, create, update, softDelete, count, existsByEmail/Phone methods

Key implementation details:
- Repository generates UUID via randomUUID() on create (schema requires id field)
- Sets updatedAt on create (schema has no @updatedAt)
- All read operations automatically filter out soft-deleted records (deletedAt: null)
- Error handling: update/softDelete throw if contact not found

Files were initially created at lib/db/ but moved to apps/web/src/lib/db/ because Prisma client is generated in apps/web node_modules.

Test file (contacts.test.ts) uses node:test with node:assert. All 9 tests pass (create, findUnique, findByEmail, findMany, update, softDelete, existsByEmail, count).

## Verification

Ran npx tsx --test src/lib/db/contacts.test.ts from apps/web directory. All 9 tests passed, verifying:
- Create generates UUID and sets updatedAt
- findUnique/findByEmail/findMany exclude soft-deleted records
- update works correctly
- softDelete sets deletedAt but preserves record
- existsByEmail/Phone count correctly
- count excludes soft-deleted records

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd D:/CLAUDE/Project/unified-crm-finance/apps/web && npx tsx --test src/lib/db/contacts.test.ts` | 0 | pass | 529ms |

## Deviations

Files placed in apps/web/src/lib/db/ instead of lib/db/ at project root because Prisma client is generated in apps/web/node_modules and imports would fail from root location.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/db/prisma.ts`
- `apps/web/src/lib/db/contacts.ts`
- `apps/web/src/lib/db/contacts.test.ts`
