---
id: S07
parent: M004
milestone: M004
provides:
  - File attachment UI for Deals (drawings, acts) and Projects (specs), Drag-and-drop file upload with progress indicators, File preview modal for images and PDFs, Cascade close: completing Project atomically closes linked Deal, FileEntity CRUD operations via /api/files
requires:
  []
affects:
  []
key_files:
  - apps/web/prisma/schema.prisma, apps/web/prisma/migrations/20260622220849_add_file_attachment_fields/migration.sql, apps/web/src/lib/storage/s3.ts, apps/web/src/lib/db/files.ts, apps/web/src/app/api/files/route.ts, apps/web/src/app/api/files/[id]/route.ts, apps/web/src/components/shared/file-upload.tsx, apps/web/src/components/shared/file-preview.tsx, apps/web/src/lib/api/files.ts, apps/web/src/app/api/deals/[id]/route.ts, apps/web/src/app/deals/[id]/page.tsx, apps/web/src/app/api/projects/[id]/route.ts, apps/web/src/app/projects/[id]/page.tsx, apps/web/src/lib/db/projects.ts, apps/web/src/app/api/projects/[id]/complete/route.ts, apps/web/src/lib/api/projects.ts, apps/web/src/lib/api/types.ts
key_decisions:
  - Used base-ui Dialog's render prop instead of asChild for AlertDialogTrigger and AlertDialogAction compatibility, Hardcoded userId='system' in UI handler since auth not implemented yet
patterns_established:
  - File upload pattern: multipart/form-data POST to /api/files, creates FileEntity record, stores in MinIO via S3 client, returns file ID for attachment to parent entity, FileRepository follows same CRUD+softDelete pattern as ContactRepository and ProjectRepository, API type extensions include both relation fields (FileEntityData) and ID fields (fileId) for create/update inputs
observability_surfaces:
  - File upload errors logged with file metadata and error reason in API routes, Cascade close transaction failures roll back both Project and Deal updates in Prisma transaction, API routes return structured {error, message} for client display
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-06-23T05:54:54.406Z
blocker_discovered: false
---

# S07: File Upload + Cascade Close

**Implemented drag-and-drop file attachments for Deals (drawings/acts) and Projects (specs), plus cascade close logic that atomically completes projects and closes linked deals**

## What Happened

## Implementation Summary

Slice S07 delivered file upload functionality and cascade close logic for the Projects module. All 9 tasks (T01-T09) completed successfully:

**T01 - Schema Extensions**: Added `drawingFileId` and `actFileId` to Deal model, `specFileId` to Project model, with FileEntity relations. Migration 20260622220849 applied.

**T02 - S3/MinIO Utility**: Created `apps/web/src/lib/storage/s3.ts` with uploadFile(), deleteFile(), getPresignedUrl(), and generateStorageKey() helper. Installed @aws-sdk/client-s3.

**T03 - File Upload API Routes**: Created FileRepository (`apps/web/src/lib/db/files.ts`), POST /api/files for uploads, and GET/DELETE /api/files/[id] for file management with presigned URLs.

**T04 - File Upload Components**: Created FileUpload (`apps/web/src/components/shared/file-upload.tsx`) with drag-drop, progress, preview, and delete; FilePreview (`apps/web/src/components/shared/file-preview.tsx`) for modal preview of images/PDFs.

**T05 - Deal File Attachments**: Integrated FileUpload into Deal detail page for Drawings (drawingFileId) and Acceptance Act (actFileId). Updated Deal API route and types.

**T06 - Project File Attachments**: Integrated FileUpload into Project detail page for Specifications (specFileId). Updated Project API route and types.

**T07 - Cascade Close Repository**: Added `completeWithCascade()` method to ProjectRepository using Prisma transaction to atomically complete Project and close related Deal. Added 4 tests, all 38 tests pass.

**T08 - Cascade Close API + UI**: Created POST /api/projects/[id]/complete/route.ts endpoint. Added "Подписать акт и закрыть проект" button to Project detail with Russian confirmation dialog.

**T09 - API Types Extension**: Extended API types with FileEntityData and file attachment fields in ProjectCreateInput/ProjectUpdateInput and DealCreateInput/DealUpdateInput.

## Integration Points

- Files stored in MinIO via S3 protocol, metadata in FileEntity table
- Deal detail page shows attached drawings/acts with preview and delete
- Project detail page shows attached specs with preview and delete  
- Complete button on Project detail triggers cascade close to linked Deal
- All file operations create FileEntity records and use presigned URLs for downloads

## Verification

## Slice-Level Verification Evidence

All task-level verification checks passed:

| Task | Check | Result |
|------|-------|--------|
| T01 | drawingFileId, actFileId, specFileId in schema | ✅ PASS |
| T02 | S3 utility exists, @aws-sdk/client-s3 installed | ✅ PASS |
| T03 | File API routes created | ✅ PASS |
| T04 | FileUpload and FilePreview components created | ✅ PASS |
| T05 | FileUpload integrated in Deal detail page | ✅ PASS |
| T06 | FileUpload integrated in Project detail page | ✅ PASS |
| T07 | completeWithCascade method exists, 38 tests pass | ✅ PASS |
| T08 | Cascade close API route and UI button created | ✅ PASS |
| T09 | FileEntityData type and file attachment fields in types.ts | ✅ PASS |

Additional verification via Grep tool confirmed all required code elements exist in the codebase.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

None.
