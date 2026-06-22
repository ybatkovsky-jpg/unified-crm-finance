---
estimated_steps: 17
estimated_files: 1
skills_used: []
---

# T01: Create Projects List Page at /projects

## Why
User needs a browsable list of all projects with filtering capability.

## Do
1. Create `apps/web/src/app/projects/page.tsx`
2. Use `apps/web/src/app/contracts/page.tsx` as template (dual filter pattern: status + contact → status + manager)
3. Implement table with columns: externalNumber, name, status, manager, contact, dates, contractAmount
4. Add status filter (lead/active/completed/paused)
5. Add manager filter - extract unique managers from fetched projects since no users API exists
6. Use projectsApi.getProjects() for data fetching
7. Add loading and error states
8. Row click navigates to `/projects/[id]` (will be S04)

## Done when
- File exists at `apps/web/src/app/projects/page.tsx`
- Page fetches projects via projectsApi
- Status and manager filters work
- Table displays project data correctly
- No TypeScript errors

## Inputs

- `apps/web/src/app/contracts/page.tsx`
- `apps/web/src/lib/api/projects.ts`

## Expected Output

- `apps/web/src/app/projects/page.tsx`

## Verification

npx tsc --noEmit --skipLibCheck apps/web/src/app/projects/page.tsx
