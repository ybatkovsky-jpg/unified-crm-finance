# Phase 6: Производство-аутсорс, Логистика, Монтаж, Доп. работы — Summary

**Completed:** 2026-06-29  
**Requirements delivered:** PROJ-08, PROJ-09, PROJ-10, PROJ-11 (4/4)

## What was done

### Schema (1 migration)
- `Production`: +`partnerId` (FK→Counterparty), +`materialMode`
- `Delivery`: +`cost`, +`deliveryType`, +`fromLocation`, +`toLocation`
- New: `Installation` (progressive multi-entry installation tracking)
- New: `InstallationWorker` (installer assignment)
- New: `ChangeOrder` (additional works / change orders)
- Back-relations: Counterparty.Production[], Project.Installation[], Project.ChangeOrder[], User.InstallationWorker[], Contract.ChangeOrder[]

### New DB Repositories (2)
- `lib/db/installation.ts` — InstallationRepository (CRUD + status machine + workers)
- `lib/db/change-orders.ts` — ChangeOrderRepository (CRUD + status machine + approve/complete)

### Extended DB Repositories (2)
- `lib/db/production.ts` — already generic, types auto-include new fields
- `lib/db/deliveries.ts` — create/update types extended

### New API Routes (5)
- `GET/POST /api/projects/[id]/installations`
- `GET/PATCH/DELETE /api/installations/[id]`
- `PATCH /api/installations/[id]/status`
- `GET/POST /api/projects/[id]/change-orders`
- `GET/PATCH/DELETE /api/change-orders/[id]`

### Extended API Routes (3)
- `POST/PATCH /api/productions/[id]` — +partnerId, +materialMode
- `POST /api/projects/[id]/productions` — +partnerId, +materialMode, include Counterparty
- `POST/PATCH /api/deliveries/[id]` — +deliveryType, +from/to, +cost

### New API Clients (2)
- `lib/api/installations.ts` — InstallationApiClient
- `lib/api/change-orders.ts` — ChangeOrderApiClient

### New UI Components (4)
- `installation-list.tsx` — карточки заходов с кнопками действий
- `create-installation-modal.tsx` — диалог создания захода
- `change-order-list.tsx` — карточки доп. работ с утверждением
- `create-change-order-modal.tsx` — диалог создания доп. работы

### Updated UI Components (5)
- `create-production-modal.tsx` — выбор партнёра + теги + materialMode
- `production-list.tsx` — показ партнёра и materialMode
- `production-detail-card.tsx` — детали партнёра
- `counterparty-form.tsx` — теги-навыков (multi-select chips) + русификация
- `delivery-create-dialog.tsx` — поля type/from/to/cost

### Page Updates (2)
- `projects/[id]/page.tsx` — секции «Монтаж», «Доп. работы»
- `counterparties/[id]/page.tsx` — таб «Поставки» с реальными данными

### Seed
- 3 production-партнёра с тегами-навыков

## Key Design Decisions
1. **Теги-навыков на Counterparty.types** — переиспользуем существующий JSON, не плодим модели
2. **Installation отдельно от ProjectStage** — ProjectStage "installation" = веха этапа, Installation = трекинг заходов
3. **ChangeOrder без обязательного Contract** — опциональная ссылка на доп. соглашение
4. **Авто-нумерация** — последовательная в пределах проекта (count + 1)
5. **Status machines** — validated transitions, auto-timestamps на started/completed

## Model Count
- Было: 62 → Стало: 65 (+Installation, +InstallationWorker, +ChangeOrder)
