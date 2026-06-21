# S01: Deal API

**Goal:** Полный CRUD API для Deal через Next.js route handlers + Prisma Repository
**Demo:** CRUD операции для сделок: создать, читать, обновлять, удалять. Перемещение между этапами с записью в DealHistory.

## Must-Haves

- GET /api/deals возвращает список с фильтрами. POST создаёт сделку с автонумерацией. PATCH обновляет поля и этап с записью в DealHistory. DELETE soft-delete.

## Proof Level

- This slice proves: API tests pass, все эндпоинты возвращают корректные данные

## Integration Closure

DealRepository интегрирован с Prisma, фильтры по pipeline/stage/manager работают

## Verification

- Structured logs для CRUD операций, ошибки логируются с контекстом (entityType, entityId, action)

## Tasks

- [x] **T01: DealRepository с методами CRUD** `est:2h`
  Создать apps/web/src/lib/db/deals.ts по аналогии с apps/web/src/lib/db/contacts.ts. Методы: findMany (с фильтрами pipelineId, stageId, managerId, contactId), findUnique, findById, create (с генерацией номера С-YYYY-NNNNN), update, softDelete. Метод moveStage для перемещения между этапами с записью в DealHistory.
  - Files: `apps/web/src/lib/db/deals.ts`
  - Verify: npm run test -- deals.test.ts (создать тестовый файл)

- [x] **T02: API route handlers для Deal** `est:2h`
  Создать API route handlers: apps/web/src/app/api/deals/route.ts (GET list, POST create), apps/web/src/app/api/deals/[id]/route.ts (GET one, PATCH update, DELETE soft delete), apps/web/src/app/api/deals/[id]/move/route.ts (POST move stage). Валидация входных данных inline.
  - Files: `apps/web/src/app/api/deals/route.ts`, `apps/web/src/app/api/deals/[id]/route.ts`, `apps/web/src/app/api/deals/[id]/move/route.ts`
  - Verify: Тестирование curl командами

- [x] **T03: Pipeline и DealStage seed данные** `est:1h`
  Создать seed скрипт для инициализации Pipeline с дефолтными стадиями. Файл apps/web/prisma/seed-deals.ts. Стадии: new, qualified, meeting, proposal, negotiation, contract, won, lost с correct order и probability.
  - Files: `apps/web/prisma/seed-deals.ts`
  - Verify: После запуска скрипта проверить через prisma studio

## Files Likely Touched

- apps/web/src/lib/db/deals.ts
- apps/web/src/app/api/deals/route.ts
- apps/web/src/app/api/deals/[id]/route.ts
- apps/web/src/app/api/deals/[id]/move/route.ts
- apps/web/prisma/seed-deals.ts
