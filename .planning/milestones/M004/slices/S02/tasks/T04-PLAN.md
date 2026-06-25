---
estimated_steps: 4
estimated_files: 3
skills_used: []
---

# T04: Create Project API routes

Create Project API routes. Collection endpoint at apps/web/src/app/api/projects/route.ts with GET (list with filters: status, managerId, contactId, dealId) and POST (create with validation: name, externalNumber required). Single resource at apps/web/src/app/api/projects/[id]/route.ts with GET (include stages, members, relations), PATCH (update with existence check), DELETE (soft delete). Follow deals route pattern with NextResponse.json({ data }) success and { error, message } errors.

**Why:** API routes expose Project CRUD to frontend via HTTP.

**Do:** Create apps/web/src/app/api/projects/route.ts with GET/POST handlers. Create apps/web/src/app/api/projects/[id]/route.ts with GET/PATCH/DELETE handlers. Use ProjectRepository for data access. Return structured responses.

**Done when:** Both route files exist, handle all verbs, return proper response shapes, pass type checking.

## Inputs

- `apps/web/src/lib/db/projects.ts`
- `apps/web/src/app/api/deals/route.ts`
- `apps/web/src/app/api/deals/[id]/route.ts`

## Expected Output

- `apps/web/src/app/api/projects/route.ts`
- `apps/web/src/app/api/projects/[id]/route.ts`

## Verification

test -f src/app/api/projects/route.ts && test -f src/app/api/projects/[id]/route.ts

## Observability Impact

API returns { error, message } for failures; NextResponse.json structure for success; error logging
