---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T05: File Attachments Integration - Deal Detail

Add file attachments section to Deal detail page. Two attachment fields: Drawings (drawingFileId) and Acceptance Act (actFileId). Integrate FileUpload component for each. Fetch related FileEntity data via Deal API. Add update logic to PATCH /api/deals/[id] to handle drawingFileId and actFileId fields.

## Inputs

- `apps/web/src/components/shared/file-upload.tsx`
- `apps/web/src/app/api/deals/[id]/route.ts`
- `apps/web/src/app/deals/[id]/page.tsx`

## Expected Output

- `apps/web/src/app/api/deals/[id]/route.ts`
- `apps/web/src/app/deals/[id]/page.tsx`

## Verification

grep -q 'FileUpload' apps/web/src/app/deals/[id]/page.tsx
