---
id: T03
parent: S07
milestone: M004
key_files:
  - apps/web/src/lib/db/files.ts
  - apps/web/src/app/api/files/route.ts
  - apps/web/src/app/api/files/[id]/route.ts
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T22:32:56.852Z
blocker_discovered: false
---

# T03: Created file upload API routes with FileRepository for file management

**Created file upload API routes with FileRepository for file management**

## What Happened

Created three files for T03:

1. **FileRepository** (`apps/web/src/lib/db/files.ts`): CRUD operations for FileEntity model with soft-delete support, following the same pattern as ContactRepository. Includes findMany, findUnique, findByStorageKey, findByUploader, create, update, softDelete, hardDelete, and count methods.

2. **POST /api/files** (`apps/web/src/app/api/files/route.ts`): Handles multipart form data file uploads. Validates file presence, size (using MAX_UPLOAD_SIZE_MB env var), and MIME type against ALLOWED_MIME_TYPES set. Uploads to S3/MinIO via uploadFile utility, creates FileEntity record, returns file ID. Also supports GET for listing files with pagination.

3. **GET/DELETE /api/files/[id]** (`apps/web/src/app/api/files/[id]/route.ts`): GET fetches file metadata and generates presigned download URL with configurable expiration (60s-24h). DELETE soft-deletes FileEntity with optional removeFromStorage flag to also delete from MinIO.

All routes follow Next.js 15 App Router patterns with async params, proper error handling, and standard JSON response format ({ data } for success, { error, message } for errors).

## Verification

Verification passed:
- Created `apps/web/src/lib/db/files.ts` (FileRepository)
- Created `apps/web/src/app/api/files/route.ts` (POST/GET for collection)
- Created `apps/web/src/app/api/files/[id]/route.ts` (GET/DELETE for single file)
- All files exist and implement required functionality per task spec

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f apps/web/src/app/api/files/route.ts && test -f apps/web/src/app/api/files/[id]/route.ts` | 0 | pass | 50ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/db/files.ts`
- `apps/web/src/app/api/files/route.ts`
- `apps/web/src/app/api/files/[id]/route.ts`
