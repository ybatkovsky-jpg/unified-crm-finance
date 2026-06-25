# T03: Add Shared and CRM bounded contexts to schema

**Estimate:** 40m
**Files:** apps/web/prisma/schema.prisma
**Inputs:** docs/05-data-model.md, docs/06-module-crm.md
**Expected Output:** schema.prisma with 13 models (Identity + Shared + CRM)

## Description

Extend schema.prisma with Shared (FileEntity, Comment, Tag, Category, Notification, AuditLog) and CRM (Company, Contact, Lead) bounded contexts. Shared entities are cross-cutting and used by all modules. CRM entities are the core business domain for customer relationship management. Add proper relations, indexes, and constraints.

**Why:** Shared entities (FileEntity, Comment, Tag) are foundational for all modules - they need to exist before domain entities can reference them. CRM is the primary business domain. Adding these together validates relation design between contexts.

## Steps

1. Add Shared models to schema.prisma:
   - FileEntity: id, fileName, storagePath, mimeType, size, uploadedById, createdAt
   - Comment: id, content, authorId, relatedEntityType, relatedEntityId, createdAt
   - Tag: id, name (unique), color, createdAt
   - Category: id, name (unique), parentId, createdAt
   - Notification: id, userId, type, title, message, isRead, createdAt
   - AuditLog: id, userId, action, entityType, entityId, changes, ipAddress, createdAt
2. Add CRM models:
   - Company: id, name, inn, kpp, legalAddress, actualAddress, contactsJson, createdAt
   - Contact: id, firstName, lastName, email, phone, companyId, position, createdAt
   - Lead: id, companyId, contactId, status, value, expectedCloseDate, createdAt
3. Add @@relation decorators linking User → FileEntity (uploadedById), User → Comment (authorId), User → Notification (userId), User → AuditLog (userId)
4. Add indexes on foreign keys and query fields: @@index([uploadedById]), @@index([authorId]), @@index([userId]), @@index([companyId])
5. Add unique constraints where appropriate: @@unique([relatedEntityType, relatedEntityId]) for Comment if needed

## Verification

```bash
grep -q "model FileEntity" apps/web/prisma/schema.prisma && \
grep -q "model Company" apps/web/prisma/schema.prisma && \
grep -c "model " apps/web/prisma/schema.prisma | grep -q 13
```

## Observability Impact

- Shared entities enable comments, tags, attachments across all modules
- CRM entities provide core customer data structure
