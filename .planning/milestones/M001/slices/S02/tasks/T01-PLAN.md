# T01: Add Prisma 6 to apps/web and create Identity schema

**Estimate:** 30m
**Files:** apps/web/package.json, apps/web/prisma/schema.prisma
**Inputs:** docs/05-data-model.md, docs/03-target-architecture.md
**Expected Output:** apps/web/prisma/schema.prisma with Identity models (User, Role, Permission, UserRole)

## Description

Install @prisma/client and prisma as dependencies (not devDependencies - needed at runtime). Create apps/web/prisma/schema.prisma with generator, client config, PostgreSQL datasource using postgres hostname (not localhost), and Identity bounded context entities (User, Role, Permission, UserRole) with UUID primary keys via gen_random_uuid() default. Set up proper indexes for foreign keys and query patterns.

**Why:** This foundational task validates Prisma + PostgreSQL integration with minimal complexity before adding 38 more entities. Identity context is required by S03 (NextAuth) and provides the auth foundation for all modules.

## Steps

1. Run `npm install @prisma/client@^6.0.0 prisma@^6.0.0` in apps/web
2. Create apps/web/prisma/ directory
3. Create schema.prisma with:
   - generator client { provider = "prisma-client-js", previewFeatures = ["fullTextSearch"] }
   - datasource db { provider = "postgresql", url = env("DATABASE_URL") }
   - User model: id (UUID, default gen_random_uuid()), email (unique, indexed), name, passwordHash, createdAt, updatedAt
   - Role model: id, name (unique), description, permissions (Json), createdAt, updatedAt
   - Permission model: id, resource, action, condition, createdAt, updatedAt
   - UserRole junction: id, userId, roleId with @@index([userId]), @@index([roleId])
4. Add @@index on foreign keys and frequently queried fields
5. Create apps/web/prisma/.keep for git tracking

## Verification

```bash
grep -q "@prisma/client" apps/web/package.json && \
grep -q "prisma" apps/web/package.json && \
test -f apps/web/prisma/schema.prisma
```

## Observability Impact

- Enables DB connection validation in health endpoint (T08)
- Provides schema foundation for all subsequent migrations
