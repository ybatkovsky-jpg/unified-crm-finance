---
id: T05
parent: S05
milestone: M004
key_files:
  - apps/web/src/app/projects/[id]/page.tsx
  - apps/web/src/lib/api/types.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T13:32:36.627Z
blocker_discovered: false
---

# T05: Integrated ProjectGantt component into project detail page, replacing stages list

**Integrated ProjectGantt component into project detail page, replacing stages list**

## What Happened

Integrated ProjectGantt component into project detail page by replacing the existing stages list (lines 441-487) with the new component. Changed icon import from Stages to Layers (Stages doesn't exist in lucide-react). Added ProjectGantt import and passed projectId and stages as props. Also fixed ProjectUpdateInput type to include externalNumber field which was missing but used in the page.

## Verification

Verified ProjectGantt import and usage in page.tsx. Also ran TypeScript compilation check which passes for the modified files.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep ProjectGantt apps/web/src/app/projects/[id]/page.tsx` | 0 | pass | 50ms |
| 2 | `npx tsc --noEmit --skipLibCheck 2>&1 | grep -E '(project-gantt|projects/\[id\]|lib/api/projects\.ts)' | head -10` | 0 | pass | 5000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/projects/[id]/page.tsx`
- `apps/web/src/lib/api/types.ts`
