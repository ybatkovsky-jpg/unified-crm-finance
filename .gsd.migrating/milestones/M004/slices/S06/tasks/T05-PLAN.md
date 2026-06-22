---
estimated_steps: 13
estimated_files: 1
skills_used: []
---

# T05: Production List Component

Build ProductionList component to display all productions for a project.

Create apps/web/src/components/projects/production-list.tsx:
- Card-based list showing all productions for the project
- Each production card displays:
  - Type badge (Плитные материалы / Столешницы)
  - Status badge with color (planning=outline, active=default, completed=secondary)
  - Progress bar (0-100%)
  - Stage indicators (small colored dots showing stage status)
  - Action buttons: edit, delete (with confirmation dialog)
- Empty state: 'Нет производств' message
- Loading state with spinner
- Uses ProductionApiClient for data fetching
- Russian labels throughout

## Inputs

- `apps/web/src/lib/api/productions.ts`
- `apps/web/src/components/projects/create-production-modal.tsx`

## Expected Output

- `apps/web/src/components/projects/production-list.tsx`

## Verification

npx tsc --noEmit 2>&1 | grep -q 'production-list' || echo 'TypeScript OK'
