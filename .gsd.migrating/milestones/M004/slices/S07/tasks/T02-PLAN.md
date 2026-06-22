---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T02: S3/MinIO Upload Utility

Install @aws-sdk/client-s3 dependency. Create S3 client wrapper utility at apps/web/src/lib/storage/s3.ts that initializes MinIO client from env vars (S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_FORCE_PATH_STYLE). Implements uploadFile(key, stream, mimeType), deleteFile(key), and getPresignedUrl(key) methods.

## Inputs

- `apps/web/package.json`
- `.env.example`

## Expected Output

- `apps/web/package.json`
- `apps/web/src/lib/storage/s3.ts`

## Verification

test -f apps/web/src/lib/storage/s3.ts && grep -q '@aws-sdk/client-s3' apps/web/package.json
