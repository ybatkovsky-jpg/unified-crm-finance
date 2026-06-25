---
estimated_steps: 7
estimated_files: 1
skills_used: []
---

# T01: CategoryRepository с иерархией

Создать CategoryRepository в apps/web/src/lib/db/categories.ts с методами:
- findTree(): возвращает плоский список категорий, отсортированный по parentid и order
- create(): с валидацией parentId (если указан, должен существовать и не создавать циклы)
- update(): с теми же валидациями
- delete(): с проверкой что категория не используется (связи с Budget/Transaction)
- findByType(): фильтр по type (income/expense)

Следовать pattern из CounterpartyRepository: randomUUID для id, manual updatedAt, soft-delete через deletedAt (хотя schema не имеет deletedAt на Category — используем isActive flag)

## Inputs

- `Prisma schema Category model`

## Expected Output

- `apps/web/src/lib/db/categories.ts`
- `apps/web/src/lib/db/categories.test.ts`

## Verification

node --test apps/web/src/lib/db/categories.test.ts
