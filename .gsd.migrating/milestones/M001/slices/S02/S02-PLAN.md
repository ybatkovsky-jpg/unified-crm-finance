# S02: S02

**Goal:** Implement complete Prisma data model with 42 entities across 7 bounded contexts, generating migrations and TypeScript types for the unified CRM-finance system
**Demo:** npx prisma migrate dev проходит, npx prisma studio показывает схему

## Must-Haves

- npx prisma migrate dev completes without errors for all migrations
- npx prisma studio displays all 42 entities with correct relations
- TypeScript types generated in node_modules/.prisma/client match schema
- ADR-002 documents Prisma + SQLAlchemy consistency strategy

## Proof Level

- This slice proves: integration

## Integration Closure

Upstream surfaces: S01 docker compose with PostgreSQL database. New wiring: Prisma client singleton for database access, migration scripts for schema evolution. What remains: S03 will consume User model for NextAuth, S05 will read schema via SQLAlchemy views.

## Verification

- Runtime signals: Migration status logs, Prisma query logging in development. Inspection surfaces: npx prisma studio (visual schema), apps/web/prisma/migrations/ directory (migration history), /api/health endpoint extended with DB connection check. Failure visibility: Migration failure logs with SQL error context, Prisma Client generation errors with type mismatch details. Redaction constraints: DATABASE_URL secret not logged.

## Tasks

- [x] **T01: Installed Prisma 6 dependencies and created Identity schema with User, Role, Permission, UserRole models** `est:30m`
  Install @prisma/client and prisma as dependencies (not devDependencies - needed at runtime). Create apps/web/prisma/schema.prisma with generator, client config, PostgreSQL datasource using postgres hostname (not localhost), and Identity bounded context entities (User, Role, Permission, UserRole) with UUID primary keys via gen_random_uuid() default. Set up proper indexes for foreign keys and query patterns.
  - Files: `apps/web/package.json`, `apps/web/prisma/schema.prisma`
  - Verify: grep -q "@prisma/client" apps/web/package.json && grep -q "prisma" apps/web/package.json && test -f apps/web/prisma/schema.prisma

- [x] **T02: Docker Desktop cannot start - blocked on infrastructure setup** `est:20m`
  Run npx prisma migrate dev to create the initial migration for Identity entities. This creates the dev database in Docker, generates SQL migration files, and validates that Prisma can connect to PostgreSQL via the postgres hostname. Then run npx prisma generate to produce TypeScript types.
  - Files: `apps/web/prisma/migrations/*`, `node_modules/.prisma/client/*`
  - Verify: test -d apps/web/prisma/migrations && ls apps/web/prisma/migrations/* | head -1 && test -f node_modules/.prisma/client/index.d.ts

- [ ] **T03: T03: Complete schema.prisma with all 42 bounded context entities** `est:60m`
  Rewrite schema.prisma to add all 38 remaining entities beyond the initial 4 Identity models: Shared (FileEntity, Comment, Tag, Category, Notification, AuditLog), CRM (Company, Contact, Lead), Sales (Deal, DealStage, DealActivity, ActivityAttachment), Contracts (Contract, ContractTemplate, ContractVersion, ContractSignatory), Projects (Project, ProjectMilestone, ProjectTask), Procurement (ProcurementRequest, Supplier, PurchaseOrder, Invoice, Payment, Budget, ApprovalRequest, Document), and Finance (Account, Transaction, Reconciliation, TaxRule, FinancialReport). Add all relations with explicit fields to handle circular dependencies (Deal ↔ Contract ↔ Project). Include indexes for foreign keys and query patterns. This is file-only work - no database required. The complete 42-entity schema should match docs/05-data-model.md specification.
  - Files: `apps/web/prisma/schema.prisma`
  - Verify: grep -c "model " apps/web/prisma/schema.prisma | grep -q 42 && grep -q "model FinancialReport" apps/web/prisma/schema.prisma && grep -q "relation(\"Contract\")" apps/web/prisma/schema.prisma

- [ ] **T07: T07: Create ADR-002 documenting Prisma + SQLAlchemy consistency strategy** `est:30m`
  Write ADR-002 at .gsd/adr/002-data-model.md documenting the data model architecture. Include: context (unified system needs TypeScript for web, Python for worker), decision (Prisma as single source of truth for schema evolution, SQLAlchemy as read-mostly mirror), consistency strategy (SQLAlchemy models mirror Prisma schema, migration sync), and verification approach. Note that migrations are deferred until Docker infrastructure is resolved (document T02 blocker).
  - Files: `.gsd/adr/002-data-model.md`
  - Verify: test -f .gsd/adr/002-data-model.md && grep -q "## Context" .gsd/adr/002-data-model.md && grep -q "## Decision" .gsd/adr/002-data-model.md && grep -q "Prisma" .gsd/adr/002-data-model.md

- [ ] **T08: T08: Create Prisma client singleton and health check stub** `est:20m`
  Create apps/web/src/lib/db.ts with a singleton PrismaClient instance using globalThis pattern to prevent multiple instances in dev with hot reload (follow Prisma docs for Next.js edge runtime compatibility). Create or update apps/web/src/app/api/health/route.ts to include a db status field - return stub status since migrations haven't been run yet (pending Docker fix). The health endpoint should be functional even without database connectivity.
  - Files: `apps/web/src/lib/db.ts`, `apps/web/src/app/api/health/route.ts`
  - Verify: test -f apps/web/src/lib/db.ts && grep -q "PrismaClient" apps/web/src/lib/db.ts && grep -q "db:" apps/web/src/app/api/health/route.ts

- [ ] **T09: T09: Execute migrations (deferred - blocked on Docker)** `est:30m`
  DEFERRED TASK - Execute all Prisma migrations once Docker infrastructure is resolved. Run npx prisma migrate dev to create migrations for the complete 42-entity schema. Requires Docker Desktop running with PostgreSQL container via 'postgres' hostname. Verify with npx prisma studio and generate TypeScript types. This task documents the migration plan but cannot execute until the T02 blocker (Docker Desktop startup failure) is resolved.
  - Files: `apps/web/prisma/migrations/*`, `node_modules/.prisma/client/*`
  - Verify: test -d apps/web/prisma/migrations && ls apps/web/prisma/migrations/ | wc -l | grep -q 8 && grep -q "export type FinancialReport" node_modules/.prisma/client/index.d.ts

## Files Likely Touched

- apps/web/package.json
- apps/web/prisma/schema.prisma
- apps/web/prisma/migrations/*
- node_modules/.prisma/client/*
- .gsd/adr/002-data-model.md
- apps/web/src/lib/db.ts
- apps/web/src/app/api/health/route.ts
