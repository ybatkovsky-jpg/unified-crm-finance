---
estimated_steps: 4
estimated_files: 3
skills_used: []
---

# T06: TypeScript compilation check

Run TypeScript compiler to verify no type errors in new Gantt component and updated project detail page. This ensures type safety and catches any integration issues.

**Why:** TypeScript compilation check catches type errors and integration issues before runtime.

**Do:** Run tsc --noEmit in apps/web directory. Verify no errors related to project-gantt or projects/[id]/page.

**Done when:** TypeScript compiles without errors.

## Inputs

- `apps/web/src/components/projects/project-gantt.tsx`
- `apps/web/src/app/projects/[id]/page.tsx`
- `apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts`

## Expected Output

- Update the implementation and proof artifacts needed for this task.

## Verification

cd apps/web && npx tsc --noEmit --skipLibCheck

## Observability Impact

TypeScript errors reported to console
