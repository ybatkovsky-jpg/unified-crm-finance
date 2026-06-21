# T05: Add Sales, Contracts, Projects bounded contexts and generate migrations

**Estimate:** 50m
**Files:** apps/web/prisma/schema.prisma, apps/web/prisma/migrations/*
**Inputs:** docs/07-module-deals.md, docs/08-module-contracts.md, docs/09-module-projects.md
**Expected Output:** schema with 25 models, migrations 004-006

## Description

Extend schema.prisma with Sales (Deal, DealStage, DealActivity, ActivityAttachment), Contracts (Contract, ContractTemplate, ContractVersion, ContractSignatory), and Projects (Project, ProjectMilestone, ProjectTask) entities. These domains have circular dependencies (Deal ↔ Contract ↔ Project) requiring explicit relation field specification. Create migrations 004_sales, 005_contracts, 006_projects.

**Why:** These are the core business domains. Circular dependencies test Prisma's relation handling. Phased migrations prove the approach works for complex inter-domain relationships.

## Steps

1. Add Sales models (4 models):
   - Deal: id, title, amount, currency, stageId, probability, expectedCloseDate, createdAt
   - DealStage: id, name, order, probability, createdAt
   - DealActivity: id, dealId, type, description, createdBy, createdAt
   - ActivityAttachment: id, activityId, fileId, createdAt
2. Add Contracts models (4 models):
   - Contract: id, number, title, type, status, amount, startDate, endDate, createdAt
   - ContractTemplate: id, name, content, createdAt
   - ContractVersion: id, contractId, versionNumber, content, createdAt
   - ContractSignatory: id, contractVersionId, userId, role, signedAt, createdAt
3. Add Projects models (3 models):
   - Project: id, name, description, status, startDate, endDate, budget, createdAt
   - ProjectMilestone: id, projectId, name, dueDate, status, createdAt
   - ProjectTask: id, projectId, milestoneId, title, status, assigneeId, dueDate, createdAt
4. Handle circular Deal ↔ Contract relation explicitly with `fields` on both sides
5. Add indexes on foreign keys
6. Run migrations: `npx prisma migrate dev --name 004_sales`, `--name 005_contracts`, `--name 006_projects`
7. Run `npx prisma generate`

## Verification

```bash
ls apps/web/prisma/migrations/ | wc -l | grep -q 6 && \
grep -c "model " apps/web/prisma/schema.prisma | grep -q 25
```

## Observability Impact

- Complete business domain schema enables deal/contract/project workflows
- Circular relation handling validates Prisma configuration
