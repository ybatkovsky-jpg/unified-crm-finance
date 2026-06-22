# S04: Project Detail Page

**Goal:** Build Project Detail Page at /projects/[id] showing project info, stages, members, and related Deal/Contract entities with edit functionality
**Demo:** User can view /dashboard/projects/[id], see project info, stages list, team members with roles, related deal/contract

## Must-Haves

- User can navigate to /projects/[id] and see project details, stages list, members list, and related Deal/Contract\n- Edit mode allows updating project fields with save/cancel\n- Related entity links navigate to Contact/Deal/Contract detail pages\n- Loading, error, and empty states render correctly

## Proof Level

- This slice proves: integration

## Integration Closure

- Upstream: ProjectApiClient.getProject from S02, ProjectData types from S02, Deal/Contract detail patterns from existing pages\n- New wiring: /projects/[id] route detail page\n- Remaining: S05 Gantt Timeline will use this detail page as base

## Verification

- Console logs for API errors with user-friendly display\n- Loading/error states visible in UI

## Tasks

- [x] **T01: Fix API route to include Deal and Contract relations** `est:30m`
  ## Why
  The GET /api/projects/[id] endpoint currently includes Contact, User, ProjectStage, and ProjectMember but not Deal or Contract relations. The detail page needs these to display linked entities. Due to Prisma schema limitations (Deal.projectId has no @relation back to Project, Contract has no projectId field), we must manually fetch these relations.
  - Files: `apps/web/src/app/api/projects/[id]/route.ts`
  - Verify: Manual review — route includes manual Deal and Contract queries using prisma client

- [x] **T02: Create Project Detail Page with stages, members, and related entities** `est:2h`
  ## Why
  Users need to view full project details including stages, team members, and related Deal/Contract. The detail page completes the Project module CRUD UI.
  - Files: `apps/web/src/app/projects/[id]/page.tsx`
  - Verify: npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "projects/[id]/page.tsx" || echo "TypeScript OK"

## Files Likely Touched

- apps/web/src/app/api/projects/[id]/route.ts
- apps/web/src/app/projects/[id]/page.tsx
