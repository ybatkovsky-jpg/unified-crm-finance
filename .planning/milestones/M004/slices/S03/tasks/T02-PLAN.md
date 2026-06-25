---
estimated_steps: 28
estimated_files: 1
skills_used: []
---

# T02: Create CreateProjectModal Component

## Why
User needs a UI to create new projects with optional links to contacts, deals, and contracts.

## Do
1. Create `apps/web/src/components/projects/create-project-modal.tsx`
2. Use `apps/web/src/components/deals/create-deal-modal.tsx` as template
3. Form fields:
   - externalNumber (required)
   - name (required)
   - description (textarea)
   - contactId (searchable dropdown - reuse contacts pattern)
   - dealId (optional searchable)
   - contractId (optional searchable)
   - managerId (select - use hardcoded list for MVP: {1: 'Admin'})
   - status (select: lead, active, completed, paused)
   - currency (default RUB)
   - contractAmount (number)
   - startDate, endDate (date inputs)
   - marginTarget (number, default 0.25)
4. Use shadcn Dialog component
5. Form validation: externalNumber and name required
6. Submit calls projectsApi.createProject()
7. Close modal on success with callback

## Done when
- Modal component exists
- Form has all required fields
- Validation works
- createProject API is called on submit
- No TypeScript errors

## Inputs

- `apps/web/src/components/deals/create-deal-modal.tsx`
- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/components/projects/create-project-modal.tsx`

## Verification

npx tsc --noEmit --skipLibCheck apps/web/src/components/projects/create-project-modal.tsx
