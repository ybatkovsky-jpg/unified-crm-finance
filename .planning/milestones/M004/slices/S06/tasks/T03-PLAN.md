---
estimated_steps: 17
estimated_files: 2
skills_used: []
---

# T03: API Client + Types - Production

Create ProductionApiClient and add production types to apps/web/src/lib/api/types.ts.

Add to types.ts:
- ProductionData, ProductionStageData
- ProductionCreateInput, ProductionUpdateInput  
- ProductionStageCreateInput, ProductionStageUpdateInput

Create apps/web/src/lib/api/productions.ts with ProductionApiClient class:
- getProductions(projectId) - list productions for project
- getProduction(id) - fetch single with stages
- createProduction(data) - create production
- updateProduction(id, data) - update production
- deleteProduction(id) - soft delete
- getStages(productionId) - list stages
- createStage(productionId, data) - create stage
- updateStage(id, data) - update stage
- deleteStage(id) - delete stage
- moveStage(id, status) - move stage status

Follow ProjectApiClient pattern from apps/web/src/lib/api/projects.ts

## Inputs

- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/api/projects.ts`

## Expected Output

- `apps/web/src/lib/api/types.ts`
- `apps/web/src/lib/api/productions.ts`

## Verification

npx tsc --noEmit 2>&1 | grep -q 'productions' || echo 'TypeScript OK'
