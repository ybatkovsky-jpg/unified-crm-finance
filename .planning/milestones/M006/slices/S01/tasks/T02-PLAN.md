---
estimated_steps: 7
estimated_files: 2
skills_used: []
---

# T02: Category API Routes

Создать API routes для Category:
- GET /api/categories: список с фильтрами type, isActive, includeInactive
- GET /api/categories/[id]: детальная запись
- POST /api/categories: создание с валидацией name, type, parentId
- PATCH /api/categories/[id]: обновление
- DELETE /api/categories/[id]: soft-delete (isActive = false)

Следовать pattern из apps/web/src/app/api/counterparties/route.ts

## Inputs

- `apps/web/src/lib/db/categories.ts`

## Expected Output

- `apps/web/src/app/api/categories/route.ts`
- `apps/web/src/app/api/categories/[id]/route.ts`

## Verification

curl -f http://localhost:3000/api/categories || true
