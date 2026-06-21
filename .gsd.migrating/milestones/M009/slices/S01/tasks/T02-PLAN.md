---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T02: API route handlers для Deal

Создать API route handlers: apps/web/src/app/api/deals/route.ts (GET list, POST create), apps/web/src/app/api/deals/[id]/route.ts (GET one, PATCH update, DELETE soft delete), apps/web/src/app/api/deals/[id]/move/route.ts (POST move stage). Валидация входных данных inline.

## Inputs

- `apps/web/src/app/api/contacts/route.ts`

## Expected Output

- `3 route.ts файла с working handlers`
- `GET /api/deals с query фильтрами`
- `POST /api/deals с валидацией`
- `PATCH /api/deals/[id] для update`
- `DELETE /api/deals/[id] для soft delete`
- `POST /api/deals/[id]/move для stage transition`

## Verification

Тестирование curl командами
