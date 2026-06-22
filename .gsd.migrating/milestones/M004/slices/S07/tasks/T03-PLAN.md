---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T03: File Upload API Routes

Create POST /api/files/route.ts for file upload (multipart form data, validates size/type using MAX_UPLOAD_SIZE_MB, uploads via S3 utility, creates FileEntity record, returns file ID). Create GET /api/files/[id]/route.ts for download (generates presigned URL) and DELETE for removal (soft-deletes FileEntity, optionally removes from MinIO).

## Inputs

- `apps/web/src/lib/storage/s3.ts`
- `apps/web/prisma/schema.prisma`
- `.env.example`

## Expected Output

- `apps/web/src/app/api/files/route.ts`
- `apps/web/src/app/api/files/[id]/route.ts`

## Verification

test -f apps/web/src/app/api/files/route.ts && test -f apps/web/src/app/api/files/[id]/route.ts
