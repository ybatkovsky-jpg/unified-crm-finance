---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T02: Create stage update API route

Create PATCH endpoint at /api/projects/[id]/stages/[stageId]/route.ts for updating stage dates via drag-drop. This enables the Gantt component to persist date changes.

**Why:** The Gantt component needs an API endpoint to persist date changes from drag-drop operations.

**Do:** Create API route file with PATCH handler that calls ProjectRepository.updateStage() method. Validate endDate >= startDate. Return success/error responses.

**Done when:** Route file exists and exports PATCH function.

## Inputs

- `apps/web/src/lib/db/projects.ts`

## Expected Output

- `apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts`

## Verification

test -f apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts

## Observability Impact

API errors logged to console with status codes
