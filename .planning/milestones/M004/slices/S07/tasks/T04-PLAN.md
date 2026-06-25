---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T04: File Upload Components

Create reusable FileUpload component (apps/web/src/components/shared/file-upload.tsx) with drag-drop zone, progress indicator, file preview (image/PDF icons), delete button with confirmation. Create FilePreview component (apps/web/src/components/shared/file-preview.tsx) for modal preview of supported formats. Both use shadcn/ui patterns matching existing modals.

## Inputs

- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/progress.tsx`

## Expected Output

- `apps/web/src/components/shared/file-upload.tsx`
- `apps/web/src/components/shared/file-preview.tsx`

## Verification

test -f apps/web/src/components/shared/file-upload.tsx && test -f apps/web/src/components/shared/file-preview.tsx
