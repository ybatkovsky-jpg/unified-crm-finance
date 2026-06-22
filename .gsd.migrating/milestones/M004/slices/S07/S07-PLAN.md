# S07: File Upload + Cascade Close

**Goal:** Implement file upload functionality (drag-drop, preview, delete) for attaching drawings to Deals and specs to Projects, plus cascade close logic where completing a Project's final stage automatically closes the related Deal.
**Demo:** User can drag-drop files to attach (drawings to deals, specs to projects), preview works, delete works; closing project with act cascades to deal

## Must-Haves

- User can drag-drop files to attach drawings to Deals and specs to Projects
- File preview displays images/PDF with delete capability
- Cascade close: clicking 'Подписать акт' on completed Project closes both Project and related Deal atomically
- All file uploads create FileEntity records in DB and store files in MinIO

## Proof Level

- This slice proves: integration

## Integration Closure

- Files uploaded through /api/files create FileEntity records and store in MinIO
- Deal detail page displays attached drawings/acts via FileUpload component
- Project detail page displays attached specs and has complete button
- Cascade close updates both Project.status='completed' and Deal.closedAt in single Prisma transaction
- What remains before milestone M004 is truly usable: nothing (S07 is the final slice)

## Verification

- File upload errors logged with file metadata and error reason
- Cascade close transaction failures roll back both Project and Deal updates
- API routes return {error, message} for client display

## Tasks

- [x] **T01: Schema Extensions: File Attachments** `est:30m`
  Add file attachment foreign keys to Deal and Project models. Deal gets drawingFileId and actFileId (nullable) following Contract.signedFileId pattern. Project gets specFileId (nullable). Run Prisma migration to apply changes.
  - Files: `apps/web/prisma/schema.prisma`, `apps/web/prisma/migrations/*/migration.sql`
  - Verify: grep -q 'drawingFileId' apps/web/prisma/schema.prisma && grep -q 'actFileId' apps/web/prisma/schema.prisma && grep -q 'specFileId' apps/web/prisma/schema.prisma

- [x] **T02: S3/MinIO Upload Utility** `est:45m`
  Install @aws-sdk/client-s3 dependency. Create S3 client wrapper utility at apps/web/src/lib/storage/s3.ts that initializes MinIO client from env vars (S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_FORCE_PATH_STYLE). Implements uploadFile(key, stream, mimeType), deleteFile(key), and getPresignedUrl(key) methods.
  - Files: `apps/web/package.json`, `apps/web/src/lib/storage/s3.ts`
  - Verify: test -f apps/web/src/lib/storage/s3.ts && grep -q '@aws-sdk/client-s3' apps/web/package.json

- [x] **T03: File Upload API Routes** `est:1h`
  Create POST /api/files/route.ts for file upload (multipart form data, validates size/type using MAX_UPLOAD_SIZE_MB, uploads via S3 utility, creates FileEntity record, returns file ID). Create GET /api/files/[id]/route.ts for download (generates presigned URL) and DELETE for removal (soft-deletes FileEntity, optionally removes from MinIO).
  - Files: `apps/web/src/app/api/files/route.ts`, `apps/web/src/app/api/files/[id]/route.ts`
  - Verify: test -f apps/web/src/app/api/files/route.ts && test -f apps/web/src/app/api/files/[id]/route.ts

- [x] **T04: File Upload Components** `est:1h`
  Create reusable FileUpload component (apps/web/src/components/shared/file-upload.tsx) with drag-drop zone, progress indicator, file preview (image/PDF icons), delete button with confirmation. Create FilePreview component (apps/web/src/components/shared/file-preview.tsx) for modal preview of supported formats. Both use shadcn/ui patterns matching existing modals.
  - Files: `apps/web/src/components/shared/file-upload.tsx`, `apps/web/src/components/shared/file-preview.tsx`
  - Verify: test -f apps/web/src/components/shared/file-upload.tsx && test -f apps/web/src/components/shared/file-preview.tsx

- [x] **T05: File Attachments Integration - Deal Detail** `est:1h`
  Add file attachments section to Deal detail page. Two attachment fields: Drawings (drawingFileId) and Acceptance Act (actFileId). Integrate FileUpload component for each. Fetch related FileEntity data via Deal API. Add update logic to PATCH /api/deals/[id] to handle drawingFileId and actFileId fields.
  - Files: `apps/web/src/app/api/deals/[id]/route.ts`, `apps/web/src/app/deals/[id]/page.tsx`
  - Verify: grep -q 'FileUpload' apps/web/src/app/deals/[id]/page.tsx

- [x] **T06: File Attachments Integration - Project Detail** `est:45m`
  Add file attachments section to Project detail page. Single attachment field: Specifications (specFileId). Integrate FileUpload component. Fetch related FileEntity via Project API (include specFile relation). Add update logic to PATCH /api/projects/[id] to handle specFileId field.
  - Files: `apps/web/src/app/api/projects/[id]/route.ts`, `apps/web/src/app/projects/[id]/page.tsx`
  - Verify: grep -q 'FileUpload' apps/web/src/app/projects/[id]/page.tsx

- [x] **T07: Cascade Close Logic - Repository** `est:45m`
  Add completeWithCascade(projectId: string, userId: string) method to ProjectRepository in apps/web/src/lib/db/projects.ts. Uses Prisma transaction to: (1) set Project.status='completed' and completedAt=now(), (2) find related Deal via dealId, (3) move Deal to won stage and set closedAt=now. Validates all project stages are completed first. Returns updated Project and Deal.
  - Files: `apps/web/src/lib/db/projects.ts`
  - Verify: grep -q 'completeWithCascade' apps/web/src/lib/db/projects.ts

- [ ] **T08: Cascade Close API + UI** `est:1h`
  Create POST /api/projects/[id]/complete/route.ts endpoint that calls ProjectRepository.completeWithCascade. Add 'Подписать акт и закрыть проект' button to Project detail page (shows when all stages are completed). Button triggers confirmation dialog explaining cascade effect ('Сделка также будет закрыта'). On success, show toast and refresh project data. Russian UI labels.
  - Files: `apps/web/src/app/api/projects/[id]/complete/route.ts`, `apps/web/src/app/projects/[id]/page.tsx`, `apps/web/src/lib/api/projects.ts`
  - Verify: test -f apps/web/src/app/api/projects/[id]/complete/route.ts && grep -q 'completeProject' apps/web/src/lib/api/projects.ts

- [ ] **T09: API Types Extension** `est:20m`
  Add FileEntityData type to apps/web/src/lib/api/types.ts for API responses. Extend ProjectData and DealData interfaces to include specFile, drawingFile, and actFile relations (nullable FileEntityData). Add ProjectCreateInput and ProjectUpdateInput extensions for file attachment fields.
  - Files: `apps/web/src/lib/api/types.ts`
  - Verify: grep -q 'FileEntityData' apps/web/src/lib/api/types.ts

## Files Likely Touched

- apps/web/prisma/schema.prisma
- apps/web/prisma/migrations/*/migration.sql
- apps/web/package.json
- apps/web/src/lib/storage/s3.ts
- apps/web/src/app/api/files/route.ts
- apps/web/src/app/api/files/[id]/route.ts
- apps/web/src/components/shared/file-upload.tsx
- apps/web/src/components/shared/file-preview.tsx
- apps/web/src/app/api/deals/[id]/route.ts
- apps/web/src/app/deals/[id]/page.tsx
- apps/web/src/app/api/projects/[id]/route.ts
- apps/web/src/app/projects/[id]/page.tsx
- apps/web/src/lib/db/projects.ts
- apps/web/src/app/api/projects/[id]/complete/route.ts
- apps/web/src/lib/api/projects.ts
- apps/web/src/lib/api/types.ts
