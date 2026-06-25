# S02: Project API + Repository — UAT

**Milestone:** M004
**Written:** 2026-06-22T10:02:52.137Z

# UAT: S02 Project API + Repository

## UAT Type
**Integration Verification** - Verifying API layer components work together for downstream UI consumption.

## Preconditions
- Node.js and npm installed
- Project dependencies installed (`npm install`)
- Prisma client generated (`npx prisma generate`)
- Test environment configured

## Test Steps

### 1. Repository Layer Verification
**Step:** Run ProjectRepository unit tests
```bash
cd apps/web && npx tsx --test src/lib/db/projects.test.ts
```
**Expected Outcome:** All 34 tests pass
- CRUD operations create, read, update, soft-delete projects
- Query helpers filter by status, manager, contact, deal
- Stage management (createStage, updateStage, findStages)
- Member management (addMember, removeMember, findMembers)
- Count excludes soft-deleted records

### 2. API Client Verification
**Step:** Run ProjectApiClient tests
```bash
cd apps/web && npx tsx --test src/lib/api/projects.test.ts
```
**Expected Outcome:** All 44 tests pass
- getProjects with filters and pagination
- getProject by ID with relations
- createProject with validation
- updateProject with partial data
- deleteProject (soft-delete)
- Error handling (400, 404, 500)
- URL construction correctness

### 3. API Routes Existence
**Step:** Verify route files exist
```bash
test -f apps/web/src/app/api/projects/route.ts
test -f apps/web/src/app/api/projects/[id]/route.ts
```
**Expected Outcome:** Both files exist
- Collection endpoint supports GET (list with filters) and POST (create)
- Single resource endpoint supports GET, PATCH, DELETE

## Edge Cases Covered
- Soft-deleted projects excluded from queries
- Empty filter parameters skipped in URL construction
- Missing required fields return 400 validation errors
- Non-existent resources return 404
- Network failures handled gracefully

## Not Proven By This UAT
- Live API server testing (requires running Next.js dev server)
- Database integration with real data (tests use in-memory SQLite)
- Authentication/authorization layers (not in scope for S02)
- Frontend integration (covered in S03-S04)
