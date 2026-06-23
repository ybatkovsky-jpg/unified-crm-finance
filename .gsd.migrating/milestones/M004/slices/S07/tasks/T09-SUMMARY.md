---
id: T09
parent: S07
milestone: M004
key_files:
  - apps/web/src/lib/api/types.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-23T05:51:14.633Z
blocker_discovered: false
---

# T09: Added specFileId to ProjectCreateInput and drawingFileId, actFileId to DealCreateInput for file attachment support

**Added specFileId to ProjectCreateInput and drawingFileId, actFileId to DealCreateInput for file attachment support**

## What Happened

The API types file already had FileEntityData, and DealData/ProjectData already included file relations (drawingFile, actFile, specFile). DealUpdateInput and ProjectUpdateInput already had file ID fields. Added the missing file ID fields to DealCreateInput (drawingFileId, actFileId) and ProjectCreateInput (specFileId).

## Verification

Verified with grep that FileEntityData type is defined and all file relation fields (drawingFile, actFile, specFile) exist on DealData and ProjectData. Confirmed drawingFileId/actFileId are in DealCreateInput and DealUpdateInput, and specFileId is in ProjectCreateInput and ProjectUpdateInput.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -n 'FileEntityData' apps/web/src/lib/api/types.ts` | 0 | pass | 150ms |
| 2 | `grep -n 'drawingFile\|actFile\|specFile' apps/web/src/lib/api/types.ts` | 0 | pass | 120ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/api/types.ts`
