---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T03: Extend API client with stage update method

Add updateStage method to ProjectApiClient in apps/web/src/lib/api/projects.ts. This provides a TypeScript-typed client method for the Gantt component to call.

**Why:** The Gantt component needs a type-safe API client method to update stage dates.

**Do:** Add async updateStage(stageId, data) method that calls PATCH /api/projects/[id]/stages/[stageId] with proper error handling.

**Done when:** projects.ts exports updateStage method.

## Inputs

- `apps/web/src/lib/api/projects.ts`
- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/lib/api/projects.ts`

## Verification

grep updateStage apps/web/src/lib/api/projects.ts

## Observability Impact

API client logs fetch errors with context
