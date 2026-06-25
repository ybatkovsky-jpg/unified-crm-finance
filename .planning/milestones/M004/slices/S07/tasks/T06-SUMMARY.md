---
id: T06
parent: S07
milestone: M004
key_files:
  - apps/web/src/app/api/projects/[id]/route.ts
  - apps/web/src/app/projects/[id]/page.tsx
  - apps/web/src/lib/api/types.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T22:42:49.544Z
blocker_discovered: false
---

# T06: Integrated file attachments for Project detail page with specFileId field

**Integrated file attachments for Project detail page with specFileId field**

## What Happened

Added file attachments functionality to Project detail page. Updated Project API route (apps/web/src/app/api/projects/[id]/route.ts) to include SpecFile relation in GET response and handle specFileId in PATCH updates. Updated ProjectData and ProjectUpdateInput types (apps/web/src/lib/api/types.ts) to include specFile and specFileId. Integrated FileUpload component into projects page with single attachment field for Specifications (specFileId). Added file upload handler (handleUploadSpec), remove handler (handleRemoveSpec), and file preview functionality with FilePreview component. The implementation follows the same pattern as the Deal detail page file attachments from T05.

## Verification

Verified FileUpload component integration in projects page (grep -q 'FileUpload' apps/web/src/app/projects/[id]/page.tsx). Verified specFileId handling in API route. Verified SpecFile relation inclusion in GET response. Verified filesApi import and usage. Verified FilePreview component usage. Verified specFile in ProjectData type and specFileId in ProjectUpdateInput type. Verified handleUploadSpec handler exists.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q 'FileUpload' apps/web/src/app/projects/[id]/page.tsx` | 0 | PASS | 100ms |
| 2 | `grep -q 'specFileId' apps/web/src/app/api/projects/[id]/route.ts` | 0 | PASS | 100ms |
| 3 | `grep -q 'specFileId' apps/web/src/lib/api/types.ts` | 0 | PASS | 100ms |
| 4 | `grep -q 'specFile' apps/web/src/app/api/projects/[id]/route.ts` | 0 | PASS | 100ms |
| 5 | `grep -q 'filesApi' apps/web/src/app/projects/[id]/page.tsx` | 0 | PASS | 100ms |
| 6 | `grep -q 'handleUploadSpec' apps/web/src/app/projects/[id]/page.tsx` | 0 | PASS | 100ms |
| 7 | `grep -q 'FilePreview' apps/web/src/app/projects/[id]/page.tsx` | 0 | PASS | 100ms |
| 8 | `grep -q 'specFile?' apps/web/src/lib/api/types.ts` | 0 | PASS | 100ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/projects/[id]/route.ts`
- `apps/web/src/app/projects/[id]/page.tsx`
- `apps/web/src/lib/api/types.ts`
