# S07: File Upload + Cascade Close — UAT

**Milestone:** M004
**Written:** 2026-06-23T05:54:54.410Z

# S07 UAT: File Upload + Cascade Close

## UAT Type
Integration UAT - Verifies end-to-end file upload workflow and cascade close functionality between Projects and Deals modules.

## Preconditions
1. Dev server running at http://localhost:3000
2. MinIO/S3 storage configured with valid credentials
3. Test data exists: at least one Deal and one Project in the database
4. User has permissions to access Deals and Projects pages

## Test Cases

### TC01: Upload Drawing to Deal
1. Navigate to `/deals/[id]` for any deal
2. Locate "Drawings" section in the detail page
3. Drag a file (image or PDF) into the drop zone
4. **Expected**: Progress indicator shows upload progress, file preview appears after upload completes, drawingFileId is set on the Deal

### TC02: Upload Acceptance Act to Deal
1. Navigate to `/deals/[id]` for any deal
2. Locate "Acceptance Act" section
3. Click upload area and select a file
4. **Expected**: File uploads successfully, preview displays, actFileId is set on the Deal

### TC03: Preview Uploaded File
1. On any Deal detail with attached file
2. Click the preview thumbnail or file icon
3. **Expected**: FilePreview modal opens showing image (for image files) or PDF viewer (for PDFs)

### TC04: Delete Attached File
1. On Deal detail page with attached file
2. Click trash icon next to file
3. Confirm deletion in dialog
4. **Expected**: File is removed from UI, drawingFileId/actFileId is cleared, FileEntity is soft-deleted

### TC05: Upload Specification to Project
1. Navigate to `/projects/[id]` for any project
2. Locate "Specifications" section
3. Drag a file into the drop zone
4. **Expected**: File uploads, preview appears, specFileId is set on the Project

### TC06: Cascade Close - Complete Project with Linked Deal
1. Create or find a Project linked to a Deal (dealId set)
2. Complete all Project stages (set all to 'completed' status)
3. On Project detail page, click "Подписать акт и закрыть проект"
4. Confirm in dialog ("Связанная сделка также будет закрыта")
5. **Expected**: Project.status='completed', Deal moved to 'won' stage with closedAt set, DealHistory entry created

### TC07: Cascade Close - Complete Project without Linked Deal
1. Create or find a Project without dealId
2. Complete all Project stages
3. Click "Подписать акт и закрыть проект"
4. **Expected**: Project completes successfully (no deal to close)

### TC08: Cascade Close - Incomplete Stages Blocked
1. Find a Project with at least one incomplete stage
2. **Expected**: "Подписать акт и закрыть проект" button is not visible or disabled

## Edge Cases Covered
- File upload with large files (>10MB): Should be rejected by MAX_UPLOAD_SIZE_MB validation
- File upload with disallowed MIME types: Should be rejected by ALLOWED_MIME_TYPES validation
- Concurrent file uploads: Each upload tracked separately with independent progress state
- Delete during upload: Should cancel upload and remove file from UI
- Network error during upload: Should show error state with retry option
- Cascade close with deleted Deal: Should complete Project without error

## Not Proven By This UAT
- MinIO/S3 storage resilience and redundancy
- File virus scanning and security validation
- File access permissions and RBAC
- File download rate limiting and bandwidth management
