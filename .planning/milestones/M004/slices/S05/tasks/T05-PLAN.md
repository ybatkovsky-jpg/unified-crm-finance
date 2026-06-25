---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T05: Integrate Gantt into project detail page

Replace the existing Stages list (lines 441-487) in project detail page with the new ProjectGantt component. This completes the integration and makes the feature visible to users.

**Why:** The Gantt needs to be integrated into the project detail page for users to access it.

**Do:** Import ProjectGantt component, replace stages list rendering, pass stages data as prop. Remove old stages.map code.

**Done when:** Project detail page imports and uses ProjectGantt component.

## Inputs

- `apps/web/src/components/projects/project-gantt.tsx`
- `apps/web/src/app/projects/[id]/page.tsx`

## Expected Output

- `apps/web/src/app/projects/[id]/page.tsx`

## Verification

grep ProjectGantt apps/web/src/app/projects/[id]/page.tsx

## Observability Impact

Page logs integration errors and render failures
