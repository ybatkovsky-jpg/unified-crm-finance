---
id: T01
parent: S02
milestone: M004
key_files:
  - apps/web/src/lib/db/projects.ts
  - apps/web/src/lib/db/projects.test.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T08:23:59.451Z
blocker_discovered: false
---

# T01: Created ProjectRepository with CRUD operations, stage management, member management, and comprehensive tests (34/34 passing)

**Created ProjectRepository with CRUD operations, stage management, member management, and comprehensive tests (34/34 passing)**

## What Happened

Created `apps/web/src/lib/db/projects.ts` with ProjectRepository class following the DealRepository pattern. Implemented:

**Core CRUD methods:**
- `findMany` - Returns projects with deletedAt=null filter
- `findUnique` - Single project lookup by ID
- `create` - Generates UUID (randomUUID), externalNumber (PRJ-YYYY-NNNNN), timestamps
- `update` - Manual updatedAt handling, verifies record exists
- `softDelete` - Sets deletedAt timestamp
- `count` - Excludes soft-deleted records

**Query helpers:**
- `findByStatus`, `findByManager`, `findByContact`, `findByDeal` - All ordered by createdAt desc

**Stage management:**
- `createStage`, `updateStage`, `findStages` - For ProjectStage entity lifecycle

**Member management:**
- `addMember`, `removeMember` (sets leftAt), `findMembers` (excludes removed members) - For ProjectMember entity

**Test coverage:**
- Created `apps/web/src/lib/db/projects.test.ts` with 34 tests
- All tests pass (creation, queries, updates, soft-delete, stages, members)
- Tests use upsert for test fixtures to handle repeated runs

Repository follows established patterns: manual UUID generation, manual updatedAt, soft-delete via deletedAt, and singleton export.

## Verification

All 34 tests pass using `npx tsx apps/web/src/lib/db/projects.test.ts`. Tests verify: CRUD operations, soft-delete behavior, stage management, member management, and query helpers (findByStatus, findByManager, findByContact, findByDeal).

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsx apps/web/src/lib/db/projects.test.ts` | 0 | pass | 455012ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/db/projects.ts`
- `apps/web/src/lib/db/projects.test.ts`
