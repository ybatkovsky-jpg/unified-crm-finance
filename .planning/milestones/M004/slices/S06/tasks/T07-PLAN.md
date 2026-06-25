---
estimated_steps: 11
estimated_files: 1
skills_used: []
---

# T07: Project Detail Page Integration

Add Production section to project detail page.

Modify apps/web/src/app/projects/[id]/page.tsx:
- Add new Card section after 'Этапы проекта' Gantt section
- Section header: 'Производство' icon from lucide-react
- 'Добавить производство' button that opens CreateProductionModal
- ProductionList component showing all productions for this project
- Fetch productions using ProductionApiClient.getProductions(projectId)
- Add state management for productions list with refresh on create/update/delete
- Handle loading and error states
- Russian labels: 'Производство', 'Добавить производство'

Verify integration by checking the production section renders and 'Add production' button opens modal.

## Inputs

- `apps/web/src/app/projects/[id]/page.tsx`
- `apps/web/src/components/projects/production-list.tsx`
- `apps/web/src/components/projects/create-production-modal.tsx`
- `apps/web/src/lib/api/productions.ts`

## Expected Output

- `apps/web/src/app/projects/[id]/page.tsx`

## Verification

grep -q 'Производство' apps/web/src/app/projects/[id]/page.tsx && grep -q 'ProductionList' apps/web/src/app/projects/[id]/page.tsx && echo 'Integration OK'
