---
estimated_steps: 13
estimated_files: 1
skills_used: []
---

# T03: Integration: Wire Modal to Projects Page

## Why
Users need to access the create project modal from the projects list page.

## Do
1. Import CreateProjectModal into projects page
2. Add 'Create Project' button (follows existing button pattern)
3. Add state for modal open/close
4. Add onCreate callback to refresh project list after creation
5. Test: click button → modal opens → submit → list refreshes

## Done when
- CreateProjectModal is imported and used
- Button triggers modal
- Creating project refreshes the list
- No TypeScript errors

## Inputs

- `apps/web/src/app/projects/page.tsx`
- `apps/web/src/components/projects/create-project-modal.tsx`

## Expected Output

- `apps/web/src/app/projects/page.tsx`

## Verification

npx tsc --noEmit --skipLibCheck apps/web/src/app/projects/page.tsx
