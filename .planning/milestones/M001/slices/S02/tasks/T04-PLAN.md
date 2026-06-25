# T04: Generate Shared and CRM migrations

**Estimate:** 20m
**Files:** apps/web/prisma/migrations/*, node_modules/.prisma/client/*
**Inputs:** apps/web/prisma/schema.prisma (from T03)
**Expected Output:** Migrations 002_shared and 003_crm created

## Description

Run prisma migrate dev for the newly added Shared and CRM entities. Create two separate migrations (002_shared and 003_crm) to maintain bounded context isolation and enable easier rollback. Regenerate Prisma client after migrations.

**Why:** Separate migrations per bounded context limit rollback blast radius. If CRM entities have issues, Shared migration remains unaffected. This validates the phased migration approach.

## Steps

1. Run `cd apps/web && npx prisma migrate dev --name 002_shared`
2. Run `cd apps/web && npx prisma migrate dev --name 003_crm`
3. Verify 3 migrations exist in apps/web/prisma/migrations/
4. Run `cd apps/web && npx prisma generate`
5. Test that all 13 models exist in generated types
6. Optional: `npx prisma studio` & to visually inspect tables (background process, kill after verification)

## Verification

```bash
test -d apps/web/prisma/migrations && \
ls apps/web/prisma/migrations/ | wc -l | grep -q 3 && \
grep -q "export type FileEntity" node_modules/.prisma/client/index.d.ts
```

## Observability Impact

- Incremental migrations enable selective rollback
- Prisma client types include Shared and CRM entities
