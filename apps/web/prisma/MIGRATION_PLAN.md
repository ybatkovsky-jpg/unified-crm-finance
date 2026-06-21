# Migration Execution Plan for Prisma Schema

## Context

This document outlines the migration plan for the complete 42-entity Prisma schema.
Migrations are currently BLOCKED on Docker Desktop availability (see T02 blocker).

## Current State

- **Schema models**: 17 (incomplete - needs 42 total)
- **Migrations created**: 2 (001_identity, 002_shared_and_crm)
- **Database**: SQLite (dev-only fallback, PostgreSQL pending Docker fix)

## Required Migrations (Planned)

Once schema.prisma has all 42 entities, run these migrations in order:

### 1. Migration: `003_sales_and_contracts`
**Entities**:
- Sales: Deal, DealStage, DealActivity, ActivityAttachment
- Contracts: Contract, ContractTemplate, ContractVersion, ContractSignatory

### 2. Migration: `004_projects`
**Entities**:
- Projects: Project, ProjectMilestone, ProjectTask

### 3. Migration: `005_procurement`
**Entities**:
- Procurement: ProcurementRequest, Supplier, PurchaseOrder, Invoice, Payment, Budget, ApprovalRequest, Document

### 4. Migration: `006_finance`
**Entities**:
- Finance: Account, Transaction, Reconciliation, TaxRule, FinancialReport

### 5. Migration: `007_indexes_and_constraints`
**Purpose**: Add performance indexes and foreign key constraints

### 6. Migration: `008_seed_data` (optional)
**Purpose**: Initial seed data for development

## Execution Steps

```bash
# 1. Verify Docker Desktop is running
docker ps | grep postgres

# 2. Verify DATABASE_URL points to PostgreSQL
cat apps/web/.env | grep DATABASE_URL

# 3. Run migrations
cd apps/web
npx prisma migrate dev --name 003_sales_and_contracts
npx prisma migrate dev --name 004_projects
npx prisma migrate dev --name 005_procurement
npx prisma migrate dev --name 006_finance
npx prisma migrate dev --name 007_indexes_and_constraints

# 4. Generate TypeScript types
npx prisma generate

# 5. Verify schema visually
npx prisma studio
```

## Verification

```bash
# Check migration count
ls apps/web/prisma/migrations/ | wc -l  # Should be 8+

# Check for FinancialReport type
grep "export type FinancialReport" node_modules/.prisma/client/index.d.ts

# Verify all models in schema
grep -c "^model " apps/web/prisma/schema.prisma  # Should be 42
```

## Blocker: Docker Desktop

**Issue**: Docker Desktop fails to start on Windows 11 Pro.
**Impact**: Cannot run PostgreSQL container, migrations must use SQLite fallback.
**Unblocking**: See T02 task summary for troubleshooting steps.

## Rollback Plan

If a migration fails:
```bash
npx prisma migrate resolve --rolled-back [migration-name]
# Fix schema.prisma
npx prisma migrate dev --name [fixed-migration-name]
```
