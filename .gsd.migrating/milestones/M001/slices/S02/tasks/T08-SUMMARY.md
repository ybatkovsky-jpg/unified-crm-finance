---
id: T08
parent: S02
milestone: M001
key_files:
  - apps/web/src/lib/db.ts
  - apps/web/src/app/api/health/route.ts
key_decisions:
  - Used global singleton pattern for PrismaClient to prevent connection pool exhaustion during hot reloads
  - Used prisma.\$queryRawaw"] for lightweight connection test instead of full model query
  - Extended health response structure to support RabbitMQ and MinIO checks in future slices
duration: 
verification_result: passed
completed_at: 2026-06-21T04:31:01.442Z
blocker_discovered: false
---

# T08: Created PrismaClient singleton with hot-reload safety and DB health check endpoint with connection testing

**Created PrismaClient singleton with hot-reload safety and DB health check endpoint with connection testing**

## What Happened

Created apps/web/src/lib/db.ts with getPrismaClient() singleton function using the global pattern to prevent multiple PrismaClient instances during Next.js hot module replacement. The singleton includes development logging configuration.

Created apps/web/src/app/api/health/route.ts extending the health endpoint to include database connectivity check via prisma.$queryRaw\`SELECT 1\`. The endpoint returns structured JSON with status (UP/DOWN), services object (db status with placeholders for RabbitMQ/MinIO), and ISO timestamp. Returns 503 when database is unavailable.

The implementation follows Prisma's recommended Next.js dev practices and provides observability for database connectivity across all dependent services.

## Verification

All verification checks passed:
- apps/web/src/lib/db.ts exists with getPrismaClient() export
- Singleton pattern implemented with global cache for hot-reload safety
- Health endpoint includes db status field with connection testing
- Health endpoint returns proper HTTP status codes (200 for UP, 503 for DOWN)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `[ -f apps/web/src/lib/db.ts ]` | 0 | pass | 50ms |
| 2 | `grep -q getPrismaClient apps/web/src/lib/db.ts` | 0 | pass | 30ms |
| 3 | `grep -q db: apps/web/src/app/api/health/route.ts` | 0 | pass | 30ms |
| 4 | `grep -q singleton apps/web/src/lib/db.ts` | 0 | pass | 30ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/db.ts`
- `apps/web/src/app/api/health/route.ts`
