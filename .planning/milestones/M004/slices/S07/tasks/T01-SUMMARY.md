---
id: T01
parent: S07
milestone: M004
key_files:
  - apps/web/prisma/schema.prisma
  - apps/web/prisma/migrations/20260622220849_add_file_attachment_fields/migration.sql
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-22T22:09:48.483Z
blocker_discovered: false
---

# T01: Added drawingFileId, actFileId to Deal and specFileId to Project with FileEntity relations; applied migration

**Added drawingFileId, actFileId to Deal and specFileId to Project with FileEntity relations; applied migration**

## What Happened

Added nullable foreign key fields to Deal (drawingFileId, actFileId) and Project (specFileId) following Contract.signedFileId pattern. Added back-relations to FileEntity model (DealAsActFile, DealAsDrawingFile, ProjectAsSpecFile). Created and applied Prisma migration 20260622220849_add_file_attachment_fields.

## Verification

Verified with grep: drawingFileId, actFileId, and specFileId all present in schema.prisma. Migration created at apps/web/prisma/migrations/20260622220849_add_file_attachment_fields/.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `grep -q 'drawingFileId' apps/web/prisma/schema.prisma && grep -q 'actFileId' apps/web/prisma/schema.prisma && grep -q 'specFileId' apps/web/prisma/schema.prisma` | 0 | PASS | 500ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/prisma/schema.prisma`
- `apps/web/prisma/migrations/20260622220849_add_file_attachment_fields/migration.sql`
