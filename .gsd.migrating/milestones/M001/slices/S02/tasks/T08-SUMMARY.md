---
id: T08
parent: S02
milestone: M001
key_files:
  - apps/web/src/lib/db.ts
  - apps/web/src/app/api/health/route.ts
key_decisions:
  - Use globalThis pattern for PrismaClient singleton to survive Next.js hot reloads in development
  - Enable verbose Prisma logging (query/error/warn) in development, error-only in production
  - Health endpoint returns 'DEGRADED' status when DB fails but service remains reachable
  - Use relative imports for API routes to avoid tsc type-check issues with @/* path aliases
duration: 
verification_result: passed
completed_at: 2026-06-20T13:32:09.733Z
blocker_discovered: false
---

# T08: Created PrismaClient singleton with hot-reload safety and DB health check endpoint with actual connection testing

**Created PrismaClient singleton with hot-reload safety and DB health check endpoint with actual connection testing**

## What Happened

Created apps/web/src/lib/db.ts implementing the singleton pattern for PrismaClient to prevent connection pool exhaustion during development hot reloads. The pattern uses globalThis to cache the client instance across module reloads and exports both getPrismaClient() function and a prisma constant for convenience.

Updated apps/web/src/app/api/health/route.ts to perform actual database connectivity tests using prisma.$queryRawSELECT 1. The health endpoint now reports 'UP' or 'DEGRADED' status based on DB connectivity, includes dbStatus ('OK'/'ERROR'), and provides dbError details when connection fails. Used relative import path for API route compatibility with TypeScript compiler.

Key decisions: (1) Export both getPrismaClient() and prisma constant for flexibility, (2) Enable query/error/warn logging in development, error-only in production, (3) Health endpoint returns 'DEGRADED' status when DB is down but service is still reachable.

## Verification

Verification commands passed:
- test -f apps/web/src/lib/db.ts confirmed file creation
- grep -q "getPrismaClient" apps/web/src/lib/db.ts confirmed singleton function
- grep -q "db:" apps/web/src/app/api/health/route.ts confirmed DB status field
- npx tsc --noEmit --skipLibCheck passed type checking

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f apps/web/src/lib/db.ts && grep -q getPrismaClient apps/web/src/lib/db.ts && grep -q db: apps/web/src/app/api/health/route.ts` | 0 | pass | 150ms |
| 2 | `npx tsc --noEmit --skipLibCheck src/lib/db.ts src/app/api/health/route.ts` | 0 | pass | 4500ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/db.ts`
- `apps/web/src/app/api/health/route.ts`
