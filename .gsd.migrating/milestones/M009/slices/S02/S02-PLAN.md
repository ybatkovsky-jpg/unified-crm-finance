# S02: Deals UI

**Goal:** Создать UI для работы с воронкой сделок: Kanban доска с drag-and-drop, фильтры, quick actions
**Demo:** Страница /deals с kanban-доской, фильтрами, quick actions. Drag-and-drop между этапами.

## Must-Haves

- Страница /deals рендерит Kanban с этапами pipelines. Drag-and-drop перемещает сделки между этапами с POST /api/deals/[id]/move. Фильтры (pipeline, manager, status) обновляют список. Модальное окно для создания/редактирования сделки.

## Proof Level

- This slice proves: Can create deal via modal, move between stages via drag-and-drop, filters work

## Integration Closure

UI использует Deal API из S01, state sync с сервером после CRUD операций

## Verification

- Client-side errors трекаются через console.error, API calls логируются с таймингом

## Tasks

- [x] **T01: Kanban board компонент** `est:3h`
  Создать apps/web/src/app/deals/page.tsx с Kanban доской. Использовать @dnd-kit/core для drag-and-drop. Fetch /api/deals с query params фильтров. Рендерить колонки по DealStage.order.
  - Files: `apps/web/src/app/deals/page.tsx`, `apps/web/src/components/deals/deal-card.tsx`, `apps/web/src/components/deals/kanban-column.tsx`, `apps/web/src/components/deals/kanban-board.tsx`
  - Verify: Открыть /deals в браузере, проверить рендер колонок, карточек, drag-and-drop

- [x] **T02: Filters и Create Deal Modal** `est:2h`
  Создать компоненты для фильтрации и quick actions. FilterBar с dropdowns для pipeline, manager, status. CreateDealButton с модальным диалогом для создания сделки. RefreshButton для reload данных.
  - Files: `apps/web/src/components/deals/filter-bar.tsx`, `apps/web/src/components/deals/create-deal-modal.tsx`
  - Verify: Открыть /deals, проверить фильтры, создать сделку через модалку

- [x] **T03: Deal Detail Page** `est:2h`
  Создать детальную страницу сделки apps/web/src/app/deals/[id]/page.tsx с секциями: Details, History (DealHistory), Related (Contacts, Tasks, Events). Edit кнопка для редактирования полей сделки.
  - Files: `apps/web/src/app/deals/[id]/page.tsx`, `apps/web/src/components/deals/deal-details.tsx`, `apps/web/src/components/deals/deal-history.tsx`
  - Verify: Открыть /deals/[id], проверить секции, редактирование

## Files Likely Touched

- apps/web/src/app/deals/page.tsx
- apps/web/src/components/deals/deal-card.tsx
- apps/web/src/components/deals/kanban-column.tsx
- apps/web/src/components/deals/kanban-board.tsx
- apps/web/src/components/deals/filter-bar.tsx
- apps/web/src/components/deals/create-deal-modal.tsx
- apps/web/src/app/deals/[id]/page.tsx
- apps/web/src/components/deals/deal-details.tsx
- apps/web/src/components/deals/deal-history.tsx
