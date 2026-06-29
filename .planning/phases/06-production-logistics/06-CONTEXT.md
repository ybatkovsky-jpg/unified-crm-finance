# Phase 6: Производство-аутсорс, Логистика, Монтаж, Доп. работы — Context

**Gathered:** 2026-06-29
**Status:** Executing
**Scope:** PROJ-08 (производство-аутсорс), PROJ-09 (логистика/доставка), PROJ-10 (прогрессивный монтаж), PROJ-11 (доп. работы)

<domain>
## Phase Boundary

Расширение проектного модуля для поддержки полного жизненного цикла производства и монтажа:
- **PROJ-08:** Назначение партнёра-производства с тегами-навыков, режим материала (наш/партнёра), воронка производства
- **PROJ-09:** Логистика доставки: поставщик→производство, производство→объект, стоимость как расход
- **PROJ-10:** Прогрессивный монтаж: многозаходный, 30% перед началом, статусы «приступили/закончили»
- **PROJ-11:** Доп. работы: формальное оформление (доп. соглашение/отдельный договор)
</domain>

<decisions>
## Implementation Decisions

### PROJ-08: Production Partner & Skill Tags
- `Production.partnerId` (FK → Counterparty) — партнёр-производство
- `Production.materialMode` — "our_materials" | "partner_materials"
- `Counterparty.types` (JSON) — теги-навыки: plate, stone, glass, concrete, paint, universal
- UI: multi-select chips в форме контрагента + Select партнёра с показом тегов в create-production-modal

### PROJ-09: Delivery Cost & Routing
- `Delivery.cost` (Decimal) — стоимость доставки (расход проекта)
- `Delivery.deliveryType` — "supplier_to_production" | "production_to_object" | "other"
- `Delivery.fromLocation` / `toLocation` — текстовые поля маршрута
- Интеграция в проект: нет отдельной секции на странице проекта (доставки в отдельном модуле Procurement)
- Починен таб Deliveries на странице контрагента

### PROJ-10: Installation Model
- Новая модель `Installation` (1:N к Project) — заходы на монтаж
- `InstallationWorker` (M:N User↔Installation) — назначение монтажников
- Статус-машина: planned → advance_paid → started → completed (+ cancelled)
- Авто-нумерация заходов в пределах проекта
- UI: карточки с кнопками быстрых действий (аванс → начать → завершить)

### PROJ-11: ChangeOrder Model
- Новая модель `ChangeOrder` (1:N к Project) — доп. работы
- Опциональная связь с Contract (доп. соглашение)
- Статус-машина: draft → approved → completed (+ cancelled)
- Авто-нумерация в пределах проекта
- UI: карточки с кнопками утверждения и завершения
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Counterparty.types` JSON field (уже был в схеме, не использовался)
- `Production` / `ProductionStage` модели + репозиторий (расширены)
- `Delivery` модель + репозиторий (расширены полями cost/deliveryType/from/to)
- Паттерн Repository → API route → API client → UI component (консистентно)
- Проектная страница с карточками (добавлены Installation, ChangeOrder, обновлён Production)

### New Assets Created
- `Installation` + `InstallationWorker` модели, репозиторий, API routes, клиент, UI
- `ChangeOrder` модель, репозиторий, API routes, клиент, UI
- `InstallationList`, `CreateInstallationModal`, `ChangeOrderList`, `CreateChangeOrderModal`
- Обновлены: `ProductionList`, `ProductionDetailCard`, `CreateProductionModal`, `CounterpartyForm`, `DeliveryCreateDialog`
</code_context>
