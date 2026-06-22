---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T09: API Types Extension

Add FileEntityData type to apps/web/src/lib/api/types.ts for API responses. Extend ProjectData and DealData interfaces to include specFile, drawingFile, and actFile relations (nullable FileEntityData). Add ProjectCreateInput and ProjectUpdateInput extensions for file attachment fields.

## Inputs

- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/lib/api/types.ts`

## Verification

grep -q 'FileEntityData' apps/web/src/lib/api/types.ts
