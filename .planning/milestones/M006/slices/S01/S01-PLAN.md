# S01: Категории доходов и расходов

**Goal:** CRUD для Category с иерархией и типом (income/expense). Пользователь может создавать и управлять иерархией категорий доходов/расходов через UI.
**Demo:** After this: Пользователь может создавать и управлять иерархией категорий доходов/расходов через UI (list + detail страницы)

## Must-Haves

- CategoryRepository с методами create, update, delete, findTree, findByType в apps/web/src/lib/db/categories.ts
- API routes GET/PATCH/DELETE /api/categories/[id], GET/POST /api/categories в apps/web/src/app/api/categories/
- UI: список категорий с отступом для иерархии, форма создания/редактирования в apps/web/src/app/finance/categories/
- API client tests в apps/web/src/lib/api/categories.test.ts (по pattern из counterparties.test.ts)

## Proof Level

- This slice proves: contract

## Integration Closure

S01 создаёт базовый surface для всех downstream slices — Transaction, Budget, CashFlowPayment зависят от Category. Не потребляет другие slices.

## Verification

- Category API возвращает 400 на invalid parentId; логи содержат id операции.

## Tasks

- [x] **T01: CategoryRepository с иерархией** `est:30m`
  Создать CategoryRepository в apps/web/src/lib/db/categories.ts с методами:
  - findTree(): возвращает плоский список категорий, отсортированный по parentid и order
  - create(): с валидацией parentId (если указан, должен существовать и не создавать циклы)
  - update(): с теми же валидациями
  - delete(): с проверкой что категория не используется (связи с Budget/Transaction)
  - findByType(): фильтр по type (income/expense)
  - Files: `apps/web/src/lib/db/categories.ts`
  - Verify: node --test apps/web/src/lib/db/categories.test.ts

- [x] **T02: Category API Routes** `est:30m`
  Создать API routes для Category:
  - GET /api/categories: список с фильтрами type, isActive, includeInactive
  - GET /api/categories/[id]: детальная запись
  - POST /api/categories: создание с валидацией name, type, parentId
  - PATCH /api/categories/[id]: обновление
  - DELETE /api/categories/[id]: soft-delete (isActive = false)
  - Files: `apps/web/src/app/api/categories/route.ts`, `apps/web/src/app/api/categories/[id]/route.ts`
  - Verify: curl -f http://localhost:3000/api/categories || true

- [x] **T03: Category API Client** `est:20m`
  Создать CategoryApiClient в apps/web/src/lib/api/categories.ts по pattern из counterparties.ts:
  - getCategories(params): с фильтрами type, isActive
  - getCategory(id): детальная запись
  - createCategory(data): создание
  - updateCategory(id, data): обновление
  - deleteCategory(id): удаление
  - Files: `apps/web/src/lib/api/categories.ts`, `apps/web/src/lib/api/types.ts`
  - Verify: node --test apps/web/src/lib/api/categories.test.ts

- [x] **T04: Category UI — List page** `est:40m`
  Создать список категорий в apps/web/src/app/finance/categories/page.tsx:
  - Table с колонками: Name, Type, Parent, Order, Status
  - Отступ для дочерних категорий ( Nested по parentId)
  - Фильтры: Type (income/expense/all), Status (active/inactive/all)
  - Create button → modal форма
  - Actions: edit, delete (deactivate)
  - Files: `apps/web/src/app/finance/categories/page.tsx`, `apps/web/src/components/finance/category-form.tsx`
  - Verify: curl -f http://localhost:3000/finance/categories || true

- [x] **T05: Category UI — Detail page** `est:30m`
  Создать детальную страницу категории в apps/web/src/app/finance/categories/[id]/page.tsx:
  - Детальная информация: name, type, parent, order, createdAt, updatedAt
  - Кнопка Edit → modal форма
  - Кнопка Delete (deactivate) с confirm
  - Список дочерних категорий (если есть)
  - Files: `apps/web/src/app/finance/categories/[id]/page.tsx`
  - Verify: curl -f http://localhost:3000/finance/categories/{id} || true

## Files Likely Touched

- apps/web/src/lib/db/categories.ts
- apps/web/src/app/api/categories/route.ts
- apps/web/src/app/api/categories/[id]/route.ts
- apps/web/src/lib/api/categories.ts
- apps/web/src/lib/api/types.ts
- apps/web/src/app/finance/categories/page.tsx
- apps/web/src/components/finance/category-form.tsx
- apps/web/src/app/finance/categories/[id]/page.tsx
