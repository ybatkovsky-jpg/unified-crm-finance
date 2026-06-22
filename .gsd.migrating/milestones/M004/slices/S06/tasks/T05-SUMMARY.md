---
id: T05
parent: S06
milestone: M004
key_files:
  - apps/web/src/components/projects/production-list.tsx
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T13:54:25.207Z
blocker_discovered: false
---

# T05: ProductionList component created - card-based list with type/status badges, progress bar, stage indicators, and delete confirmation

**ProductionList component created - card-based list with type/status badges, progress bar, stage indicators, and delete confirmation**

## What Happened

Created apps/web/src/components/projects/production-list.tsx:

Features:
- Card-based list displaying all productions for a project
- Each production card shows:
  - Type badge from attributes (PLATE/Плитные материалы or COUNTERTOP/Столешницы)
  - Status badge with color variants (planning=outline, active=default, completed=secondary)
  - Progress bar (0-100%) with percentage display
  - Stage indicators (colored dots showing each stage status: pending=gray, in_progress=blue, completed=green, blocked=red)
  - Completed stages count (e.g., "3/8")
  - Planned date range (start to end)
  - Notes (truncated to 2 lines)
  - Delete button with confirmation dialog
- Loading state with spinner
- Empty state with package icon and descriptive message
- Error state with retry button
- Delete confirmation AlertDialog (non-destructive action)
- Russian UI labels throughout

Uses productionsApi.getProductions for data fetching and productionsApi.deleteProduction for deletion. Auto-refreshes on mount and after operations.

TypeScript compilation verified with no errors.

## Verification

TypeScript compilation check passed with no production-list errors. Component follows established patterns with proper loading/error/empty states and confirmation dialogs for destructive actions.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit 2>&1 | grep -E 'production-list|error TS'` | 0 | pass | 30000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/components/projects/production-list.tsx`
