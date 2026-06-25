# S02: Бюджеты проектов

**Goal:** CRUD для Budget с привязкой к проекту и категории. Пользователь может устанавливать бюджет на проект по категории и периоду (месяц/квартал/год).
**Demo:** After this: Пользователь может устанавливать бюджет на проект по категории и периоду (месяц/квартал/год)

## Must-Haves

- BudgetRepository с методами create, update, delete, findByProject, findByPeriod в apps/web/src/lib/db/budgets.ts
- API routes GET/PATCH/DELETE /api/budgets/[id], GET/POST /api/budgets в apps/web/src/app/api/budgets/
- UI: виджет на /projects/[id] для budget progress
- API client tests

## Tasks

- [ ] **T01: BudgetRepository** `est:20m`
  Создать BudgetRepository в apps/web/src/lib/db/budgets.ts с методами:
  - create(): валидация categoryId и projectId существования
  - update(): обновление amount, period, note
  - delete(): удаление бюджета
  - findByProject(): все бюджеты проекта
  - findByPeriod(): фильтр по периоду
  - Files: `apps/web/src/lib/db/budgets.ts`

- [ ] **T02: Budget API Routes** `est:25m`
  Создать API routes для Budget:
  - GET /api/budgets: список с фильтрами projectId, categoryId, period
  - GET /api/budgets/[id]: детальная запись
  - POST /api/budgets: создание с валидацией
  - PATCH /api/budgets/[id]: обновление
  - DELETE /api/budgets/[id]: удаление
  - Files: `apps/web/src/app/api/budgets/route.ts`, `apps/web/src/app/api/budgets/[id]/route.ts`

- [ ] **T03: Budget API Client** `est:15m`
  Создать BudgetApiClient в apps/web/src/lib/api/budgets.ts по pattern из categories.ts:
  - getBudgets(params): с фильтрами
  - getBudget(id): детальная запись
  - createBudget(data): создание
  - updateBudget(id, data): обновление
  - deleteBudget(id): удаление
  - Files: `apps/web/src/lib/api/budgets.ts`, `apps/web/src/lib/api/types.ts`

- [ ] **T04: Budget UI — виджет на проекте** `est:30m`
  Создать виджет бюджета на странице проекта:
  - Список бюджетов проекта сгруппированный по периодам
  - Форма добавления бюджета (выбор категории, период, сумма)
  - Редактирование/удаление бюджета
  - Progress bar: budget vs actual (если есть транзакции — будет в S03)
  - Files: `apps/web/src/components/finance/budget-widget.tsx`, модификация `apps/web/src/app/projects/[id]/page.tsx`
