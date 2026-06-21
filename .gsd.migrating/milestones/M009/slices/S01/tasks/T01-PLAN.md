---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: DealRepository с методами CRUD

Создать apps/web/src/lib/db/deals.ts по аналогии с apps/web/src/lib/db/contacts.ts. Методы: findMany (с фильтрами pipelineId, stageId, managerId, contactId), findUnique, findById, create (с генерацией номера С-YYYY-NNNNN), update, softDelete. Метод moveStage для перемещения между этапами с записью в DealHistory.

## Inputs

- `apps/web/src/lib/db/contacts.ts`
- `apps/web/prisma/schema.prisma`

## Expected Output

- `deals.ts с DealRepository классом`
- `Методы: findMany, findUnique, findById, create, update, softDelete, moveStage, count`
- `Генерация номера формата С-{YYYY}-{XXXXX}`

## Verification

npm run test -- deals.test.ts (создать тестовый файл)
