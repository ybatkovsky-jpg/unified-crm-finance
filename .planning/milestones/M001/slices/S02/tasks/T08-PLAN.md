# T08: Create Prisma client singleton and add DB health check

**Estimate:** 20m
**Files:** apps/web/src/lib/db.ts, apps/web/src/app/api/health/route.ts
**Inputs:** apps/web/prisma/schema.prisma (from T06)
**Expected Output:** DB singleton with health endpoint integration

## Description

Create apps/web/src/lib/db.ts with a singleton PrismaClient instance (preventing multiple instances in dev with hot reload). Add database connection check to apps/web/src/app/api/health/route.ts, extending the health endpoint to report Postgres connection status. This provides the wiring for all future database access.

**Why:** PrismaClient singleton is a best practice - multiple instances cause connection pool exhaustion. DB health check enables S02 verification and provides observability for all dependent slices. This is the integration point between Prisma and the runtime.

## Steps

1. Create apps/web/src/lib/db.ts:
   - Import PrismaClient from @prisma/client
   - Declare global prisma variable (for dev hot reload)
   - Export function getPrismaClient() that returns singleton instance
   - Add JSDoc comment explaining singleton pattern
2. Update apps/web/src/app/api/health/route.ts:
   - Import getPrismaClient
   - Add prisma.$queryRaw`SELECT 1` to test DB connection
   - Extend response: `{ status: 'UP', services: { db: 'OK' | 'ERROR', rabbitmq, minio } }`
   - Handle Prisma errors gracefully (return db: 'ERROR')
3. Test: curl http://localhost:3000/api/health should include db status

## Verification

```bash
test -f apps/web/src/lib/db.ts && \
grep -q "getPrismaClient" apps/web/src/lib/db.ts && \
grep -q "db:" apps/web/src/app/api/health/route.ts
```

## Observability Impact

- Health endpoint reports DB connection status for monitoring
- DB singleton enables efficient connection pooling
- Provides integration point for all future DB access
