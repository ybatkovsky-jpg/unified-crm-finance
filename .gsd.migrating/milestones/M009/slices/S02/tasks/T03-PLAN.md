---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T03: Deal Detail Page

Создать детальную страницу сделки apps/web/src/app/deals/[id]/page.tsx с секциями: Details, History (DealHistory), Related (Contacts, Tasks, Events). Edit кнопка для редактирования полей сделки.

## Inputs

- `apps/web/src/app/api/deals/[id]/route.ts`

## Expected Output

- `Страница /deals/[id] с layout`
- `Details секция (все поля сделки с Edit)`
- `History секция (список DealHistory записей)`
- `Related секция (связанные Contact, Task, Event)`
- `PATCH /api/deals/[id] для сохранения изменений`

## Verification

Открыть /deals/[id], проверить секции, редактирование
