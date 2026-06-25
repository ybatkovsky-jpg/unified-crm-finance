---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T04: Create ProjectGantt component

Create vis-timeline based Gantt component at apps/web/src/components/projects/project-gantt.tsx. This is the core UI component for timeline visualization.

**Why:** The Gantt component renders project stages as timeline bars with drag-drop, color coding, and zoom.

**Do:** Create component with vis-timeline integration, status color mapping, drag-drop handlers, loading/error states. Use getStageStatusColor pattern from detail page. Configure day-level zoom.

**Done when:** Component file exists and imports vis-timeline.

## Inputs

- `apps/web/src/app/projects/[id]/page.tsx`

## Expected Output

- `apps/web/src/components/projects/project-gantt.tsx`

## Verification

test -f apps/web/src/components/projects/project-gantt.tsx

## Observability Impact

Component logs drag-drop operations and initialization errors
