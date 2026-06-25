---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T01: Schema Extensions: File Attachments

Add file attachment foreign keys to Deal and Project models. Deal gets drawingFileId and actFileId (nullable) following Contract.signedFileId pattern. Project gets specFileId (nullable). Run Prisma migration to apply changes.

## Inputs

- `apps/web/prisma/schema.prisma`

## Expected Output

- `apps/web/prisma/schema.prisma`
- `apps/web/prisma/migrations`

## Verification

grep -q 'drawingFileId' apps/web/prisma/schema.prisma && grep -q 'actFileId' apps/web/prisma/schema.prisma && grep -q 'specFileId' apps/web/prisma/schema.prisma
