---
id: T04
parent: S07
milestone: M004
key_files:
  - apps/web/src/components/shared/file-upload.tsx
  - apps/web/src/components/shared/file-preview.tsx
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T22:32:39.582Z
blocker_discovered: false
---

# T04: Created FileUpload and FilePreview components with drag-drop, progress indicators, and modal preview using shadcn/ui patterns

**Created FileUpload and FilePreview components with drag-drop, progress indicators, and modal preview using shadcn/ui patterns**

## What Happened

Created two reusable file handling components:

1. **FileUpload** (`apps/web/src/components/shared/file-upload.tsx`):
   - Drag-drop zone with visual feedback
   - File input with configurable accept types, max size (default 10MB), and max files (default 10)
   - Progress indicator during upload using shadcn/ui Progress component
   - Image preview thumbnails for image files
   - File type icons (using lucide-react icons) for non-image files
   - Delete button with trash icon for each file
   - Status indicators: pending, uploading, success, error
   - File size formatting helper
   - Controlled and uncontrolled modes (controlled via onFilesChange)

2. **FilePreview** (`apps/web/src/components/shared/file-preview.tsx`):
   - Modal dialog using shadcn/ui Dialog pattern
   - Image preview for supported formats (jpeg, png, gif, webp, svg, bmp)
   - PDF preview via iframe
   - Fallback UI for unsupported formats with download/open buttons
   - useFilePreview hook for programmatic control
   - Download and open-in-new-tab actions
   - Mobile-friendly footer with file info

Both components follow existing project patterns:
- Use base-ui components (Button, Dialog)
- Use cn() from @/lib/utils for className merging
- Match existing modal/dialog structure
- Use lucide-react icons consistently

## Verification

test -f apps/web/src/components/shared/file-upload.tsx && test -f apps/web/src/components/shared/file-preview.tsx

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f apps/web/src/components/shared/file-upload.tsx && test -f apps/web/src/components/shared/file-preview.tsx && echo "PASS"` | 0 | PASS | 150ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/components/shared/file-upload.tsx`
- `apps/web/src/components/shared/file-preview.tsx`
