---
id: T05
parent: S07
milestone: M004
key_files:
  - apps/web/src/lib/api/files.ts
  - apps/web/src/app/api/deals/[id]/route.ts
  - apps/web/src/app/deals/[id]/page.tsx
  - apps/web/src/lib/api/types.ts
key_decisions: []
duration: 
verification_result: mixed
completed_at: 2026-06-22T22:38:47.697Z
blocker_discovered: false
---

# T05: Integrated file attachments for Deal detail page with drawingFileId and actFileId fields

**Integrated file attachments for Deal detail page with drawingFileId and actFileId fields**

## What Happened

Added file attachments functionality to Deal detail page. Created files API client (apps/web/src/lib/api/files.ts) for file upload, retrieval, and deletion. Updated DealData and DealUpdateInput types to include drawingFile and actFile relations. Modified Deal API route to include drawingFile and actFile in GET response and handle drawingFileId/actFileId in PATCH updates. Integrated FileUpload component into deals page with two attachment fields: Drawings (drawingFileId) and Acceptance Act (actFileId). Added file preview, upload, and remove functionality with proper state management.

## Verification

Verified FileUpload component integration in deals page (grep -q 'FileUpload' apps/web/src/app/deals/[id]/page.tsx). Verified drawingFileId and actFileId handling in API route. Verified filesApi import and usage. Verified FileUploadFile type export in types.ts. Checked file upload API client structure with uploadFile, getFile, and deleteFile methods.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q 'FileUpload' apps/web/src/app/deals/[id]/page.tsx` | -1 | unknown (coerced from string) | 0ms |
| 2 | `0` | -1 | unknown (coerced from string) | 0ms |
| 3 | `PASS` | -1 | unknown (coerced from string) | 0ms |
| 4 | `100` | -1 | unknown (coerced from string) | 0ms |
| 5 | `grep -q 'drawingFileId' apps/web/src/app/api/deals/[id]/route.ts` | -1 | unknown (coerced from string) | 0ms |
| 6 | `0` | -1 | unknown (coerced from string) | 0ms |
| 7 | `PASS` | -1 | unknown (coerced from string) | 0ms |
| 8 | `100` | -1 | unknown (coerced from string) | 0ms |
| 9 | `grep -q 'actFileId' apps/web/src/app/api/deals/[id]/route.ts` | -1 | unknown (coerced from string) | 0ms |
| 10 | `0` | -1 | unknown (coerced from string) | 0ms |
| 11 | `PASS` | -1 | unknown (coerced from string) | 0ms |
| 12 | `100` | -1 | unknown (coerced from string) | 0ms |
| 13 | `grep -q 'filesApi' apps/web/src/app/deals/[id]/page.tsx` | -1 | unknown (coerced from string) | 0ms |
| 14 | `0` | -1 | unknown (coerced from string) | 0ms |
| 15 | `PASS` | -1 | unknown (coerced from string) | 0ms |
| 16 | `100` | -1 | unknown (coerced from string) | 0ms |
| 17 | `[ -f apps/web/src/lib/api/files.ts ]` | -1 | unknown (coerced from string) | 0ms |
| 18 | `0` | -1 | unknown (coerced from string) | 0ms |
| 19 | `PASS` | -1 | unknown (coerced from string) | 0ms |
| 20 | `100` | -1 | unknown (coerced from string) | 0ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/api/files.ts`
- `apps/web/src/app/api/deals/[id]/route.ts`
- `apps/web/src/app/deals/[id]/page.tsx`
- `apps/web/src/lib/api/types.ts`
