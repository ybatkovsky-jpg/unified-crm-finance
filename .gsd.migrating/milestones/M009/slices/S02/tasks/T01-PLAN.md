---
estimated_steps: 1
estimated_files: 4
skills_used: []
---

# T01: Kanban board компонент

Создать apps/web/src/app/deals/page.tsx с Kanban доской. Использовать @dnd-kit/core для drag-and-drop. Fetch /api/deals с query params фильтров. Рендерить колонки по DealStage.order.

## Inputs

- `apps/web/src/app/api/deals/route.ts`

## Expected Output

- `Kanban board с колонками для каждого stage`
- `Сделки рендерятся как карточки`
- `Drag-and-drop между колонками работает`
- `POST /api/deals/[id]/move вызывается при drop`

## Verification

Открыть /deals в браузере, проверить рендер колонок, карточек, drag-and-drop
