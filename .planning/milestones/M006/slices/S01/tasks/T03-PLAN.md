---
estimated_steps: 7
estimated_files: 2
skills_used: []
---

# T03: Category API Client

Создать CategoryApiClient в apps/web/src/lib/api/categories.ts по pattern из counterparties.ts:
- getCategories(params): с фильтрами type, isActive
- getCategory(id): детальная запись
- createCategory(data): создание
- updateCategory(id, data): обновление
- deleteCategory(id): удаление

Добавить типы в apps/web/src/lib/api/types.ts: CategoryData, CategoryCreateInput, CategoryUpdateInput, CategoryListParams

## Inputs

- `apps/web/src/app/api/categories/`

## Expected Output

- `apps/web/src/lib/api/categories.ts`
- `apps/web/src/lib/api/categories.test.ts`

## Verification

node --test apps/web/src/lib/api/categories.test.ts
