---
estimated_steps: 7
estimated_files: 2
skills_used: []
---

# T01: API Routes - Production Endpoints

Create Next.js API routes for Production CRUD operations. Following the established pattern from projects API, implement:

1. GET /api/projects/[id]/productions - List all productions for a project (with stages)
2. POST /api/projects/[id]/productions - Create new production (validates unique projectId)
3. GET /api/productions/[id] - Fetch single production with stages
4. PATCH /api/productions/[id] - Update production (status, progress, dates)
5. DELETE /api/productions/[id] - Soft delete production

Use ProductionRepository from apps/web/src/lib/db/production.ts. Return NextResponse.json({ data: result }) for success, { error, message } for errors.

## Inputs

- `apps/web/src/lib/db/production.ts`
- `apps/web/src/app/api/projects/[id]/route.ts`

## Expected Output

- `apps/web/src/app/api/projects/[id]/productions/route.ts`
- `apps/web/src/app/api/productions/[id]/route.ts`

## Verification

npx tsc --noEmit 2>&1 | grep -q 'productions' || echo 'TypeScript OK'

## Observability Impact

Console logging for API errors with structured error messages
