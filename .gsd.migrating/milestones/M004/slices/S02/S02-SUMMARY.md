---
id: S02
parent: M004
milestone: M004
provides:
  - ["ProjectRepository for data access", "ProjectApiClient for frontend API calls", "Project types for type safety", "API routes at /api/projects/*"]
requires:
  []
affects:
  - []
key_files: []
key_decisions:
  - ["Used Prisma relation names (ProjectStage, ProjectMember, User, Contact) to match schema-generated types", "Applied as const assertion to resolve TypeScript inference issues with nested Prisma includes", "Used mock factories (mockProject, mockStage, mockMember) to reduce test duplication"]
patterns_established:
  - ["API client tests follow DealApiClient.test pattern with mock factories and comprehensive error coverage", "Repository tests use upsert for test fixtures to handle repeated runs"]
observability_surfaces:
  - ["console.error logging in all API route catch blocks", "Structured error responses with { error, message } format"]
drill_down_paths:
  - ["S03 will build Project List + Create UI using ProjectApiClient", "S04 will build Project Detail Page with full relations"]
duration: ""
verification_result: passed
completed_at: 2026-06-22T10:02:52.133Z
blocker_discovered: false
---

# S02: Project API + Repository

**Implemented ProjectRepository with CRUD/stage/member management (34 tests passing), Next.js API routes (GET/POST/PATCH/DELETE with filtering), ProjectApiClient with typed methods (44 tests passing), and comprehensive TypeScript types**

## What Happened

## Narrative

Slice S02 successfully implemented the backend foundation for project management. All six tasks completed with no blockers or deviations.

### T01: ProjectRepository
Created `apps/web/src/lib/db/projects.ts` with ProjectRepository class following DealRepository patterns. Implemented: CRUD operations (findMany, findUnique, create with UUID/number generation, update with manual updatedAt, softDelete, count), query helpers (findByStatus, findByManager, findByContact, findByDeal), stage management (createStage, updateStage, findStages), and member management (addMember, removeMember with leftAt, findMembers). 34 tests pass.

### T02: Repository Unit Tests
Tests were created together with T01. All 34 tests cover CRUD, soft-delete, count, stages, members, and query methods.

### T03: API Types
Added comprehensive Project types to `apps/web/src/lib/api/types.ts`: ProjectData with relations (manager, contact, deal, contract, stages, members), ProjectStageData, ProjectMemberData, ProjectFilters, ProjectListParams, and input types for CRUD operations.

### T04: API Routes
Created collection endpoint at `apps/web/src/app/api/projects/route.ts` (GET list with filters, POST create) and single resource at `apps/web/src/app/api/projects/[id]/route.ts` (GET, PATCH, DELETE). Follows Next.js patterns with NextResponse.json({ data }) success and { error, message } errors. Resolved TypeScript includes issue with `as const` assertion.

### T05: ProjectApiClient
Created `apps/web/src/lib/api/projects.ts` with ProjectApiClient class following DealApiClient pattern. Includes: url() helper, getProjects with filtering, getProject, createProject, updateProject, deleteProject. Uses shared utilities (parseApiError, parseJson, ApiClientError). Exports singleton 'projectsApi' and convenience methods.

### T06: API Client Tests
Created `apps/web/src/lib/api/projects.test.ts` with 44 tests covering all CRUD methods, error handling (400, 404, 500), URL construction, network failures, and singleton pattern. All tests pass.

### Key Decisions
- Used Prisma relation names (ProjectStage, ProjectMember, User, Contact) to match schema-generated types
- Applied `as const` assertion to resolve TypeScript inference issues with nested Prisma includes
- Used mock factories (mockProject, mockStage, mockMember) to reduce test duplication

## Verification

## Verification Evidence

| Command | Exit Code | Verdict | Duration |
|---|---|---|---|---|
| `npx tsx --test apps/web/src/lib/db/projects.test.ts` | 0 | pass | 1027ms |
| `npx tsx --test apps/web/src/lib/api/projects.test.ts` | 0 | pass | 505ms |
| `test -f apps/web/src/app/api/projects/route.ts` | 0 | pass | - |
| `test -f apps/web/src/app/api/projects/[id]/route.ts` | 0 | pass | - |

All tests pass:
- ProjectRepository: 34/34 tests (CRUD, soft-delete, count, stages, members, query helpers)
- ProjectApiClient: 44/44 tests (CRUD methods, error handling, URL construction, network failures)
- API routes exist and follow Next.js patterns with filtering support

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `apps/web/src/lib/db/projects.ts` — ProjectRepository with CRUD, stage management, member management
- `apps/web/src/lib/db/projects.test.ts` — 34 unit tests for ProjectRepository
- `apps/web/src/lib/api/types.ts` — Added Project types (ProjectData, ProjectStageData, ProjectMemberData, inputs)
- `apps/web/src/app/api/projects/route.ts` — Collection endpoint (GET list, POST create)
- `apps/web/src/app/api/projects/[id]/route.ts` — Single resource endpoint (GET, PATCH, DELETE)
- `apps/web/src/lib/api/projects.ts` — ProjectApiClient with typed CRUD methods
- `apps/web/src/lib/api/projects.test.ts` — 44 API client tests with mocked fetch
