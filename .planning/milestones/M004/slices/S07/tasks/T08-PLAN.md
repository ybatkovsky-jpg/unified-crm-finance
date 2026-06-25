---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T08: Cascade Close API + UI

Create POST /api/projects/[id]/complete/route.ts endpoint that calls ProjectRepository.completeWithCascade. Add 'Подписать акт и закрыть проект' button to Project detail page (shows when all stages are completed). Button triggers confirmation dialog explaining cascade effect ('Сделка также будет закрыта'). On success, show toast and refresh project data. Russian UI labels.

## Inputs

- `apps/web/src/lib/db/projects.ts`
- `apps/web/src/lib/api/projects.ts`
- `apps/web/src/app/projects/[id]/page.tsx`
- `apps/web/src/components/ui/alert-dialog.tsx`

## Expected Output

- `apps/web/src/app/api/projects/[id]/complete/route.ts`
- `apps/web/src/app/projects/[id]/page.tsx`
- `apps/web/src/lib/api/projects.ts`

## Verification

test -f apps/web/src/app/api/projects/[id]/complete/route.ts && grep -q 'completeProject' apps/web/src/lib/api/projects.ts
