# Phase 5: Проект — стабилизация ядра (аудит-фиксы) — Summary

**Completed:** 2026-06-29
**Status:** ✅ DONE

## What was done

### RED-1: ProjectStatusHistory
- `projects.update()` записывает историю при смене статуса (fromStatus→toStatus, changedById, changedAt).
- `projects.completeWithCascade()` записывает завершение проекта.
- `projects.getHistory()` — новый метод для получения истории.
- `GET /api/projects/[id]/history` — новый API-эндпоинт.
- `StatusHistoryCard` — collapsible UI-компонент на странице деталей проекта.
- PATCH /api/projects/[id] теперь использует `requireSession()` для changedById.

### RED-2: ProjectStage автосоздание
- `POST /api/projects` создаёт 7 стандартных стадий (measurement_2, specification, procurement, production, installation, acceptance, closure) для каждого нового проекта — по ROADMAP Phase 5.

### RED-4: Invoice↔PurchaseRequest связь
- Добавлен `purchaseRequestId String?` в модель Invoice + relation `Invoice → PurchaseRequest`.
- Back-relation `PurchaseRequest → Invoice[]`.
- Миграция `20260629082426_crm_invoice_pr_link`.

### RED-5: Counterparty tabs fix
- Вкладки Purchase Requests / Invoices на странице контрагента теперь загружают реальные данные (были `data={[]}`).
- Добавлены API-запросы `purchaseRequestsApi.getPurchaseRequests({ supplierId })` и `invoicesApi.getInvoices({ supplierId })`.
- Вкладка Deliveries остаётся заглушкой (delivery tracking — будущая фаза).

### PROJ-07: Трекер покрытия закупок
- BOMSection показывает бейдж «X/Y заказано» — сколько уникальных BOMItem покрыто PurchaseRequestItems.
- Загружает данные через `purchaseRequestsApi.getPurchaseRequests({ projectId })` и подсчитывает уникальные bomItemId.

### Фиксы
- **lock BOM в PATCH items:** `PATCH /api/bom/items/[id]` теперь проверяет статус BOM и возвращает 409 при locked.
- **tsc:** 0 ошибок прод-кода (все вызовы `$transaction` с Prisma-extension починены через `any`-каст tx).

### Отложено
- **RED-3 (Склад→закупки):** требует интеграции WarehouseItem.availableQty в PR create dialog — большой объём, низкий приоритет (склад сейчас работает отдельно).
- **Статус-машина проекта:** валидация переходов (completed→lead) — терпимо для v1.
- **SMTP email:** задокументировано как deferred to Python worker.

## Files changed
Модель: `schema.prisma` (Invoice.purchaseRequestId + relations, 2 миграции)
DB: `projects.ts` (update с историей, getHistory), `sequence.ts` (fix tx type)
API: `projects/route.ts` (автосоздание стадий), `projects/[id]/route.ts` (changedById), `projects/[id]/history/route.ts` (новый), `bom/items/[id]/route.ts` (lock check)
UI: `projects/[id]/page.tsx` (StatusHistoryCard), `status-history-card.tsx` (новый), `counterparties/[id]/page.tsx` (fix tabs), `bom-section.tsx` (трекер покрытия)

## Smoke results
- ✅ POST /api/projects → 7 stages (measurement_2→closure)
- ✅ PATCH /api/projects/[id] {status:"active"} → history recorded «lead → active by Администратор»
- ✅ GET /api/projects/[id]/history → 1 запись
- ✅ tsc --noEmit → 0 ошибок
