# S03: Project List + Create UI

**Goal:** Build Project List page with filters (status, manager) and CreateProjectModal for creating projects from deals/contracts
**Demo:** User can browse /dashboard/projects, filter by status/manager, create project via modal, see project cards in table

## Must-Haves

- Complete the planned slice outcomes.

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [ ] **T01: Create Projects List Page at /projects** `est:2h`
  ## Why
  User needs a browsable list of all projects with filtering capability.
  - Files: `apps/web/src/app/projects/page.tsx`
  - Verify: npx tsc --noEmit --skipLibCheck apps/web/src/app/projects/page.tsx

- [ ] **T02: Create CreateProjectModal Component** `est:2h`
  ## Why
  User needs a UI to create new projects with optional links to contacts, deals, and contracts.
  - Files: `apps/web/src/components/projects/create-project-modal.tsx`
  - Verify: npx tsc --noEmit --skipLibCheck apps/web/src/components/projects/create-project-modal.tsx

- [ ] **T03: Integration: Wire Modal to Projects Page** `est:30m`
  ## Why
  Users need to access the create project modal from the projects list page.
  - Files: `apps/web/src/app/projects/page.tsx`
  - Verify: npx tsc --noEmit --skipLibCheck apps/web/src/app/projects/page.tsx

## Files Likely Touched

- apps/web/src/app/projects/page.tsx
- apps/web/src/components/projects/create-project-modal.tsx
