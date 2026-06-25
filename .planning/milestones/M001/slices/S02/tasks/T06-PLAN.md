# T06: Add Procurement, Finance bounded contexts and complete migrations

**Estimate:** 50m
**Files:** apps/web/prisma/schema.prisma, apps/web/prisma/migrations/*
**Inputs:** docs/10-module-procurement.md, docs/11-module-finance.md
**Expected Output:** Complete schema with 42 models, 8 migrations

## Description

Extend schema.prisma with remaining entities: Procurement (ProcurementRequest, Supplier, PurchaseOrder, Invoice, Payment, Budget, ApprovalRequest, Document) and Finance (Account, Transaction, Reconciliation, TaxRule, FinancialReport). Create final migrations 007_procurement and 008_finance. Verify complete 42-entity schema with all relations.

**Why:** Completes the data model per specification. Procurement and Finance are complex domains with many inter-dependencies. Final migration proves the entire schema is valid and migratable.

## Steps

1. Add Procurement models (8 models):
   - ProcurementRequest: id, requestNumber, title, status, amount, requestedBy, createdAt
   - Supplier: id, name, inn, contactEmail, createdAt
   - PurchaseOrder: id, supplierId, requestId, orderNumber, amount, status, createdAt
   - Invoice: id, supplierId, amount, dueDate, status, createdAt
   - Payment: id, invoiceId, amount, paidAt, method, createdAt
   - Budget: id, fiscalYear, category, amount, spent, createdAt
   - ApprovalRequest: id, type, entityId, status, requestedBy, createdAt
   - Document: id, fileId, relatedEntityType, relatedEntityId, createdAt
2. Add Finance models (5 models):
   - Account: id, name, accountNumber, type, balance, createdAt
   - Transaction: id, accountId, amount, type, description, transactionDate, createdAt
   - Reconciliation: id, accountId, startDate, endDate, status, createdAt
   - TaxRule: id, name, rate, applicableFrom, createdAt
   - FinancialReport: id, type, period, generatedAt, createdAt
3. Link Procurement entities to existing models (Company, User, FileEntity)
4. Add all remaining indexes and unique constraints
5. Run `npx prisma migrate dev --name 007_procurement`
6. Run `npx prisma migrate dev --name 008_finance`
7. Run `npx prisma generate`
8. Verify: 8 migrations total, 42 models, all types generated

## Verification

```bash
grep -c "model " apps/web/prisma/schema.prisma | grep -q 42 && \
ls apps/web/prisma/migrations/ | wc -l | grep -q 8 && \
grep -q "export type FinancialReport" node_modules/.prisma/client/index.d.ts
```

## Observability Impact

- Complete data model enables full system functionality
- All migrations provide complete schema evolution history
