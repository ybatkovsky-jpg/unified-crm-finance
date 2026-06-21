# S02: Kanban Board UI

**Goal:** Страница /deals показывает колонки по stage order (все 8 стадий даже без сделок); drag-and-drop карточек между колонками вызывает API move и сохраняет relation-данные (stage, contact, manager) в UI; FilterBar фильтрует по статусу (open/closed); CreateDealModal создаёт сделку с возможностью привязки контакта
**Demo:** Страница /deals показывает колонки по stage order; drag-and-drop карточки между колонками вызывает API move; FilterBar фильтрует по статусу; CreateDealModal создаёт сделку

## Must-Haves

- GET /api/pipelines/[id] возвращает pipeline со stages, отсортированными по order, даже когда сделок нет
- Kanban-доска рендерит все 8 колонок (new, qualified, meeting, proposal, negotiation, contract, won, lost) независимо от наличия сделок
- После drag-and-drop карточка сохраняет имя стадии, имя контакта и имя менеджера (не обнуляются)
- Колонка подсвечивается при наведении карточки (isOver feedback)
- Ошибка перемещения вызывает refetch deals вместо alert() и не портит UI-стейт
- CreateDealModal содержит поиск контакта через GET /api/contacts с фильтрацией на клиенте
- Фильтр по статусу (open/closed/all) работает через существующий FilterBar
- Pipeline ID определяется через API, а не хардкод

## Proof Level

- This slice proves: integration

## Integration Closure

Upstream surfaces consumed: DealRepository (apps/web/src/lib/db/deals.ts) — findMany, moveStage, create; ContactApiClient (apps/web/src/lib/api/contacts.ts) — getContacts; Prisma Pipeline/DealStage models (apps/web/prisma/schema.prisma)

New wiring introduced: GET /api/pipelines (list), GET /api/pipelines/[id] (with stages include), PipelineApiClient (apps/web/src/lib/api/pipelines.ts) consumed by deals page

What remains before milestone end-to-end: S03 (Deal Detail Page + DealHistoryTimeline), S04 (Contract Repository + API + Deal Conversion), S05 (Contract List + Detail Pages)

## Verification

- Runtime signals: pipeline API returns standard JSON error shape { error, message } на 404/500; moveDeal errors log to console.error и trigger refetch
- Inspection surfaces: GET /api/pipelines и GET /api/pipelines/[id] доступны для curl/fetch диагностики; kanban board DOM содержит data-stage-id атрибуты на колонках
- Failure visibility: ошибка move возвращает 400/500 и текст ошибки, UI делает полный refetch deals; консольное логирование ошибок
- Redaction constraints: PII (contact names, manager names) отображается в UI но не содержится в логах ошибок

## Tasks

- [x] **T01: Pipeline API endpoint with client and tests** `est:45m`
  Why: The kanban board currently derives stages from deals via extractStagesFromDeals(), so empty stages disappear and the board shows 'No pipeline stages found' when no deals exist. A dedicated pipeline API is needed to return stages independently.
  - Files: `apps/web/src/app/api/pipelines/route.ts`, `apps/web/src/app/api/pipelines/[id]/route.ts`, `apps/web/src/lib/api/pipelines.ts`, `apps/web/src/lib/api/pipelines.test.ts`
  - Verify: cd apps/web && npx tsx --test src/lib/api/pipelines.test.ts

- [x] **T02: Fix moveDeal relations, KanbanColumn drop target, and drag-over feedback** `est:40m`
  Why: Three bugs break drag-and-drop: (1) moveStage returns deal without relations, so after a move the card loses stage name/contact/manager display; (2) drop target is only on CardHeader, not full column, making drops on the card area miss; (3) no visual feedback when dragging over a column.
  - Files: `apps/web/src/lib/db/deals.ts`, `apps/web/src/components/deals/kanban-column.tsx`, `apps/web/src/app/deals/page.tsx`
  - Verify: cd apps/web && npx tsx --test src/lib/db/deals.test.ts

- [ ] **T03: Add contact selector to CreateDealModal** `est:35m`
  Why: CreateDealModal creates deals with title/amount/currency/date but has no way to link a contact. For CRM purposes, most deals should be linked to a contact. The API accepts contactId (optional), so this is a gap in the UI.
  - Files: `apps/web/src/components/deals/create-deal-modal.tsx`
  - Verify: cd apps/web && npx tsc --noEmit

- [ ] **T04: Wire pipeline API into deals page and remove hardcoded values** `est:30m`
  Why: The deals page has two hardcoded values: pipelineId = "default-pipeline-id" (line 94) and changedBy = "current-user-id" (line 70). It derives stages from deals via extractStagesFromDeals(), the root cause of empty columns. After T01, stages should come from the pipeline API.
  - Files: `apps/web/src/app/deals/page.tsx`
  - Verify: cd apps/web && npx tsc --noEmit

## Files Likely Touched

- apps/web/src/app/api/pipelines/route.ts
- apps/web/src/app/api/pipelines/[id]/route.ts
- apps/web/src/lib/api/pipelines.ts
- apps/web/src/lib/api/pipelines.test.ts
- apps/web/src/lib/db/deals.ts
- apps/web/src/components/deals/kanban-column.tsx
- apps/web/src/app/deals/page.tsx
- apps/web/src/components/deals/create-deal-modal.tsx
