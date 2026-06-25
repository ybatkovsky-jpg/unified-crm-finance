---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T06: File Attachments Integration - Project Detail

Add file attachments section to Project detail page. Single attachment field: Specifications (specFileId). Integrate FileUpload component. Fetch related FileEntity via Project API (include specFile relation). Add update logic to PATCH /api/projects/[id] to handle specFileId field.

## Inputs

- `apps/web/src/components/shared/file-upload.tsx`
- `apps/web/src/app/api/projects/[id]/route.ts`
- `apps/web/src/app/projects/[id]/page.tsx`

## Expected Output

- `apps/web/src/app/api/projects/[id]/route.ts`
- `apps/web/src/app/projects/[id]/page.tsx`

## Verification

grep -q 'FileUpload' apps/web/src/app/projects/[id]/page.tsx
