# Research: Slice S07 - File Upload + Cascade Close

## Summary

Slice S07 requires implementing two distinct features: (1) File upload functionality for attaching documents to Deals and Projects, and (2) Cascade close logic where completing a Project's final stage (акт/acceptance act) automatically closes the related Deal. The FileEntity model already exists with MinIO storage configuration in `.env.example`, but Deal and Project models lack direct file attachment relations. Cascade close requires bidirectional status sync between Project and Deal when the final "sign act" stage is completed.

## Key Findings

### Existing Infrastructure

**FileEntity Model** (`apps/web/prisma/schema.prisma:501-519`):
- Already exists with fields: `id`, `fileName`, `storageKey`, `mimeType`, `size`, `bucket`, `uploadedBy`, `createdAt`
- Storage backend: MinIO (S3-compatible), configured via environment variables:
  - `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_FORCE_PATH_STYLE`
- Upload limits defined: `MAX_UPLOAD_SIZE_MB=50`, `MAX_EXCEL_SIZE_MB=10`, `MAX_PDF_SIZE_MB=50`
- **Missing**: Direct foreign key relations from Deal or Project to FileEntity

**Deal-Project Relationship**:
- `Deal.projectId` (unique, nullable) → links Deal to Project
- `Project.dealId` (unique, nullable) → links Project to Deal
- Bidirectional unique constraint allows 1:1 optional relationship
- Both entities have `closedAt` / `completedAt` fields for tracking closure

**Project Stages** (from docs `09-module-projects.md:29-30`):
- 8 standard stages: Проектирование → Спецификация → Запрос счетов → Комплектация → Производство → Доставка → Монтаж → **Подписание акта**
- Final stage "Подписание акта" (signing of acceptance act) triggers cascade close

**File Usage in Existing Models**:
- `Contract.signedFileId` → `FileEntity` (signed contract document)
- `Invoice.sourceFileId` → `FileEntity` (invoice PDF)
- `BOM.sourceFileId` → `FileEntity` (BOM Excel file)
- `Interaction.fileId[]` (via Interaction relation)
- `Comment` has `FileEntity[]` relation for attachments

### Missing Components

1. **Schema Extensions Required**:
   - Deal has no direct file attachment field (drawings, acts)
   - Project has no direct file attachment field (specs)
   - Need to add `files` relation or use JSON field for file IDs

2. **File Upload API**:
   - No existing `/api/files` or `/api/uploads` endpoint
   - No S3/MinIO upload library in dependencies (need `@aws-sdk/client-s3`)
   - No existing file upload React components

3. **Cascade Close Logic**:
   - No existing API endpoint for final stage completion with cascade
   - `DealRepository` has `moveToStage()` that sets `closedAt` for won/lost stages
   - `ProjectRepository` lacks cascade close method

## Constraints and Gotchas

### Schema Limitations

- **FileEntity relations**: Current schema uses explicit foreign keys (`signedFileId`, `sourceFileId`) rather than many-to-many junction tables
- **Bidirectional cascade**: Both `Deal.projectId` and `Project.dealId` are unique — updating one requires updating the other atomically
- **File attachment pattern**: Must decide between:
  - Option A: Add `drawingFileId`, `actFileId` foreign keys to Deal
  - Option B: Add `specFileId[]` JSON array to Project
  - Option C: Create junction tables `DealFile`, `ProjectFile`

### Production Stage Dependencies

- `ProductionStage` auto-sets `completedAt` when status changes to 'completed' (pattern in `production.ts:287-305`)
- Last production stage completion could trigger project completion cascade

### Transaction Safety

- Cascade close must use Prisma transaction to ensure both Deal and Project update atomically
- Rollback required if either update fails

## Implementation Approach

### Part 1: File Upload

**Recommended Pattern**: Create minimal file upload infrastructure

1. **Add S3 SDK dependency**: `npm install @aws-sdk/client-s3`

2. **Create file upload API** (`/api/files/route.ts`):
   - POST: Handle multipart form data, validate size/type
   - Upload to MinIO using S3 client
   - Create FileEntity record in DB
   - Return file ID for attachment

3. **Add file attachment fields**:
   - For Deal: Add `drawingFileId?`, `actFileId?` to schema (follows `Contract.signedFileId` pattern)
   - For Project: Add `specFileId?` (or use `attributes` JSON for multiple files)
   - Run migration

4. **Create file upload components**:
   - Reuse shadcn/ui patterns for modal and form
   - Simple drag-drop zone with progress indicator
   - File preview component (image/PDF)
   - Delete confirmation

### Part 2: Cascade Close

**Approach**: Extend existing repository pattern

1. **Add cascade close method to ProjectRepository**:
   ```typescript
   async completeWithAct(projectId: string): Promise<Project> {
     return prisma.$transaction(async (tx) => {
       // 1. Update project: status='completed', completedAt=now
       // 2. Find related deal via dealId
       // 3. Update deal: move to won stage, closedAt=now
     })
   }
   ```

2. **Create API endpoint** (`/api/projects/[id]/complete/route.ts`):
   - POST: Triggers cascade close
   - Validates all stages are completed
   - Returns updated project and deal

3. **UI integration**:
   - Add "Подписать акт" button on project detail when final stage is active
   - Show confirmation dialog explaining cascade effect
   - Display success toast with closed deal reference

## Build Order

1. **Schema first**: Add file attachment fields to Deal/Project models, run migration
2. **S3 integration**: Install @aws-sdk/client-s3, create upload utility
3. **File API**: POST /api/files for upload, GET /api/files/[id] for download
4. **Cascade logic**: Add `completeWithAct()` to ProjectRepository
5. **Cascade API**: POST /api/projects/[id]/complete
6. **UI components**: FileUpload, FilePreview, CompleteProjectButton
7. **Page integration**: Add file sections to deal/project detail pages

## Dependencies

- **S04**: Project detail page must exist before adding file attachments
- **S06**: Production stages must be complete before cascade close makes sense

## Files Targeted

### New Files
- `apps/web/src/lib/storage/s3.ts` - S3/MinIO client wrapper
- `apps/web/src/app/api/files/route.ts` - File upload endpoint
- `apps/web/src/app/api/files/[id]/route.ts` - File download/delete
- `apps/web/src/components/shared/file-upload.tsx` - Reusable upload component
- `apps/web/src/components/shared/file-preview.tsx` - File preview component
- `apps/web/src/app/api/projects/[id]/complete/route.ts` - Cascade close endpoint

### Modified Files
- `apps/web/prisma/schema.prisma` - Add file attachment fields
- `apps/web/src/lib/db/projects.ts` - Add cascade close method
- `apps/web/src/lib/api/projects.ts` - Add completeProject() method
- `apps/web/src/lib/api/types.ts` - Add FileEntityData type
- `apps/web/src/app/deals/[id]/page.tsx` - Add file attachments section
- `apps/web/src/app/projects/[id]/page.tsx` - Add file attachments + complete button

## Verification Approach

- File upload: Test drag-drop with PDF/image, verify MinIO storage, check FileEntity record
- File preview: Open preview modal, verify display for PDF and images
- File delete: Verify DB record soft-deleted, MinIO file removed (or retained per policy)
- Cascade close: Create test project with deal, complete final stage, verify deal.closedAt set
- Transaction rollback: Mock failure in deal update, verify project not completed

## Risks

1. **MinIO availability**: Dev environment may not have MinIO running
   - Mitigation: Add fallback to local filesystem storage or graceful error message

2. **File size limits**: Next.js has default 1MB body size limit
   - Mitigation: Configure `apiBodySizeLimit` in next.config.js or use streaming

3. **Bidirectional sync**: Updating both Deal.projectId and Project.dealId could race
   - Mitigation: Use Prisma transaction, update only one side via cascade

4. **Stage code detection**: Identifying which stage is the "act" stage
   - Mitigation: Use stage code constant `ACT_SIGN` or check stage order/attributes

## Open Questions

- Should file attachments support multiple files per entity (gallery) or single file?
- Should deleted files be removed from MinIO or just marked deleted in DB?
- Should cascade close work bidirectionally (deal close → project close) or only project → deal?
- Should there be an explicit "Act" entity or just use final ProjectStage completion?
