---
id: T04
parent: S02
milestone: M004
key_files:
  - apps/web/src/app/api/projects/route.ts
  - apps/web/src/app/api/projects/[id]/route.ts
key_decisions:
  - Used Prisma relation names (ProjectStage, ProjectMember, User, Contact) instead of lowercase aliases to match schema-generated types
  - Applied as const assertion to include parameter to resolve TypeScript inference issues with nested Prisma includes
  - Changed default status from 'active' to 'lead' to match schema default
duration: 
verification_result: passed
completed_at: 2026-06-22T09:32:00.345Z
blocker_discovered: false
---

# T04: Created Project API routes (collection and single resource) with GET/POST/PATCH/DELETE handlers, filtering support, and error logging

**Created Project API routes (collection and single resource) with GET/POST/PATCH/DELETE handlers, filtering support, and error logging**

## What Happened

Created two Next.js API route files for Project CRUD operations:

1. **apps/web/src/app/api/projects/route.ts** - Collection endpoint:
   - GET: Lists all projects with optional filters (status, managerId, contactId, dealId), includes ProjectStage, ProjectMember (with User details), Contact, and User relations
   - POST: Creates new project with validation (name, externalNumber required)

2. **apps/web/src/app/api/projects/[id]/route.ts** - Single resource endpoint:
   - GET: Fetches project by ID with full relations
   - PATCH: Updates project fields with existence check
   - DELETE: Soft-deletes project via ProjectRepository

Both routes follow the deals route pattern:
- NextResponse.json({ data }) for success responses
- NextResponse.json({ error, message }, status) for errors (400, 404, 500)
- console.error logging in catch blocks for observability
- Type-safe Prisma relations (ProjectStage, ProjectMember, User, Contact)

Resolved TypeScript type issue with nested includes using `as const` assertion for proper type inference.

## Verification

- Both route files exist at apps/web/src/app/api/projects/route.ts and apps/web/src/app/api/projects/[id]/route.ts
- TypeScript compilation passes without errors for project routes
- GET endpoint supports filters: status, managerId, contactId, dealId
- POST validates required fields (name, externalNumber)
- PATCH verifies project existence before update
- DELETE uses soft-delete via repository
- Error responses follow structured { error, message } format
- console.error logging in all catch blocks

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f src/app/api/projects/route.ts && test -f src/app/api/projects/[id]/route.ts && echo 'Both files exist'` | 0 | pass | 50ms |
| 2 | `npx tsc --noEmit --skipLibCheck 2>&1 | grep 'src/app/api/projects'` | 0 | pass | 8500ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/projects/route.ts`
- `apps/web/src/app/api/projects/[id]/route.ts`
