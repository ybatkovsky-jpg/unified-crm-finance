# T02: Generate initial migration and verify Prisma setup

**Estimate:** 20m
**Files:** apps/web/prisma/migrations/*, node_modules/.prisma/client/*
**Inputs:** apps/web/prisma/schema.prisma (from T01)
**Expected Output:** Migration 001_identity created, Prisma client generated

## Description

Run npx prisma migrate dev to create the initial migration for Identity entities. This creates the dev database in Docker, generates SQL migration files, and validates that Prisma can connect to PostgreSQL via the postgres hostname. Then run npx prisma generate to produce TypeScript types.

**Why:** Migrations are the proof that schema is valid. Generation produces the type-safe client that Next.js and Prisma-based code will use. This task validates the entire toolchain before adding complexity.

## Steps

1. Ensure docker compose up -d postgres is running (postgres service must be accessible)
2. Run `cd apps/web && npx prisma migrate dev --name 001_identity`
3. Verify migration created in apps/web/prisma/migrations/
4. Run `cd apps/web && npx prisma generate`
5. Check that node_modules/.prisma/client/index.d.ts was generated with User, Role, Permission, UserRole types
6. Test connection: `cd apps/web && npx prisma db execute --sql "SELECT count(*) FROM \"User\""` should return 0 (empty table)

## Verification

```bash
test -d apps/web/prisma/migrations && \
ls apps/web/prisma/migrations/* | head -1 && \
test -f node_modules/.prisma/client/index.d.ts
```

## Observability Impact

- Prisma client types enable type-safe DB access in app code
- Migration files provide schema evolution history
