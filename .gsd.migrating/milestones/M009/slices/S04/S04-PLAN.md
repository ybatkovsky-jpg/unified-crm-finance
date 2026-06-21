# S04: Contract API

**Goal:** Создать полный API для работы с договорами: CRUD, шаблоны, версии, подписанты, конвертация из сделки
**Demo:** CRUD для контрактов, шаблонов, версий, подписантов. Конвертация сделки в контракт.

## Must-Haves

- GET /api/contracts возвращает список с фильтрами. POST создаёт контракт с автонумерацией Д-YYYY-NNNNN. GET /api/contracts/[id] с include versions/signers. POST /api/contracts/[id]/versions создаёт версию. POST /api/contracts/[id]/signers добавляет подписанта. POST /api/deals/[id]/convert конвертирует сделку в контракт.

## Proof Level

- This slice proves: API tests pass, конвертация Deal→Contract работает корректно, версии записываются

## Integration Closure

ContractRepository использует Prisma, связывается с Deal (dealId), Contact (contactId), ContractTemplate (templateId)

## Verification

- Structured logs для CRUD операций, ошибки логируются с контекстом (entityType, entityId, action)

## Tasks

- [x] **T01: ContractRepository с версионностью** `est:3h`
  Создать apps/web/src/lib/db/contracts.ts с ContractRepository. Методы: findMany, findUnique, findById, create (генерация номера Д-YYYY-NNNNN), update, softDelete. Методы для версий: addVersion, getVersions. Методы для подписантов: addSigner, getSigners. Метод convertFromDeal для конвертации сделки в контракт.
  - Files: `apps/web/src/lib/db/contracts.ts`
  - Verify: npm run test -- contracts.test.ts

- [x] **T02: Contract API routes** `est:2h`
  Создать API route handlers: apps/web/src/app/api/contracts/route.ts (GET list, POST create), apps/web/src/app/api/contracts/[id]/route.ts (GET one, PATCH update, DELETE soft delete), apps/web/src/app/api/contracts/[id]/versions/route.ts (GET list, POST create), apps/web/src/app/api/contracts/[id]/signers/route.ts (GET list, POST add).
  - Files: `apps/web/src/app/api/contracts/route.ts`, `apps/web/src/app/api/contracts/[id]/route.ts`, `apps/web/src/app/api/contracts/[id]/versions/route.ts`, `apps/web/src/app/api/contracts/[id]/signers/route.ts`
  - Verify: Тестирование curl командами

- [x] **T03: Convert Deal to Contract** `est:1h`
  Добавить POST /api/deals/[id]/convert endpoint для конвертации сделки в контракт. Создаёт Contract с данными из Deal, связывает dealId, выставляет status='draft'.
  - Files: `apps/web/src/app/api/deals/[id]/convert/route.ts`
  - Verify: curl тест: создать сделку, конвертировать, проверить связку

## Files Likely Touched

- apps/web/src/lib/db/contracts.ts
- apps/web/src/app/api/contracts/route.ts
- apps/web/src/app/api/contracts/[id]/route.ts
- apps/web/src/app/api/contracts/[id]/versions/route.ts
- apps/web/src/app/api/contracts/[id]/signers/route.ts
- apps/web/src/app/api/deals/[id]/convert/route.ts
