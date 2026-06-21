---
estimated_steps: 14
estimated_files: 1
skills_used: []
---

# T04: Wire pipeline API into deals page and remove hardcoded values

Why: The deals page has two hardcoded values: pipelineId = "default-pipeline-id" (line 94) and changedBy = "current-user-id" (line 70). It derives stages from deals via extractStagesFromDeals(), the root cause of empty columns. After T01, stages should come from the pipeline API.

Do:
1. Import pipelinesApi from @/lib/api/pipelines (created in T01).
2. Replace extractStagesFromDeals() with pipeline API call: pipelinesApi.getPipeline(pipelineId) returns pipeline with DealStage[] sorted by order.
3. Pipeline ID resolution: first call pipelinesApi.getPipelines() to get available pipelines, use the first active one. If none found, show empty state. Fallback: if API fails, try hardcoded "default-pipeline-id" with a console.warn.
4. Update loading/error/empty states:
   - Loading: pipeline or deals still fetching
   - Error: either pipeline or deals fetch failed (show specific message)
   - Empty stages: pipeline loaded but no DealStage[] (show "No pipeline stages configured")
   - Empty deals: stages exist but deals array empty (kanban renders empty columns correctly per T02)
5. Keep changedBy as "current-user-id" with TODO comment (auth out of scope).
6. Remove extractStagesFromDeals function entirely.
7. Verify with tsc --noEmit.

Done when: Page fetches stages from GET /api/pipelines/[id]; kanban shows all 8 columns from pipeline even with empty deals; pipelineId from API; extractStagesFromDeals removed.

## Inputs

- `apps/web/src/app/deals/page.tsx`
- `apps/web/src/lib/api/pipelines.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/components/deals/kanban-board.tsx`

## Expected Output

- `apps/web/src/app/deals/page.tsx`

## Verification

cd apps/web && npx tsc --noEmit
