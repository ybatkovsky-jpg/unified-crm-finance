# Phase 4 (ядро): CRM — жизненный цикл сделки - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning
**Scope:** Ядро фазы 4 — CRM-01 (источники), CRM-03 (дни до конца проекта), CRM-06 (отказ с причиной), CRM-07 (единая нумерация + автосоздание проекта/договора). CRM-02 (канбан DnD) уже работает.

<domain>
## Phase Boundary

Жизненный цикл сделки от первого обращения до договора:
- Сделка создаётся с **источником лида** из полного списка (10 канонических источников ТЗ).
- На канбан-карточке показывается **«дни до конца проекта»** (после конвертации в проект).
- Сделку можно закрыть **отказом с обязательной причиной** из справочника.
- Перевод в стадию «Договор заключён» → автосоздание **проекта и договора с единым номером** `ПМ{год}-{NNNN}`.

Отложено из фазы 4 в будущие фазы:
- **CRM-05 (КП с версионированием)** → Фаза 5: КП выводится из дизайн-проекта + спецификации/материалов (PROJ-03), материалов пока нет.
- **CRM-08 (бонус дизайнера 10%)** → Фаза 8: выплата разово после всех денег клиента = FIN-06; начисление можно завести позже вместе с финансами.
- **CRM-04 (замер #1 как задача)** → Фаза 10: требует модуль задач (Task), которого пока нет (ни API, ни UI); PLAT-01.

</domain>

<decisions>
## Implementation Decisions

### Источник лида (CRM-01)
- **Где хранить:** `Deal.sourceId` (FK → LeadSource). По ТЗ «каждое обращение сразу сделка», источник — атрибут сделки (не контакта). Contact.sourceId уже есть и остаётся для справки.
- **Справочник:** 10 канонических источников (2gis, website, internet, instagram, vk, telegram_group, office, referral, old_base, designer). Старые коды (call/email/telegram/other) → `isActive:false` (upsert сохраняет существующие ссылки; UI фильтрует по isActive).
- **Сущность LeadSource остаётся ORM-моделью** (уже есть в схеме), т.к. справочник источников хранится в БД сMetaData (description, isActive). UI тянет через `GET /api/lead-sources`.

### Отказ с причиной (CRM-06)
- **Справочник причин:** TypeScript-константы в `lib/loss-reasons.ts` (`LOSS_REASONS = [{code,label}]`: too_expensive, competitor, changed_mind, lost_contact, other). Статичен, не требует ORM-модели.
- **`lossReason` хранит code** (строковый код причины).
- **Обязательность:** в `moveStage`, если целевая стадия `isLostStage` и `lossReason` не передан/не из справочника → throw → роут мапит в 400.
- **UI:** модалка «Закрыть отказом» (выбор причины + опц. комментарий).

### Единая нумерация ПМ{год}-NNNN (CRM-07)
- **Формат:** `ПМ{YYYY}-{0001}` — год **динамический** (`new Date().getFullYear()`), счётчик сквозной в пределах года (по существующим Project.externalNumber с префиксом `ПМ{год}`).
- **Общий номер для проекта и договора** (ТЗ: «Номер один на проект и договор»). В единой транзакции создаётся проект + договор с одним и тем же `ПМ…`.
- **Единый генератор** `lib/db/sequence.ts: nextProjectNumber(tx, year)` (принимает tx для атомарности). Старые генераторы (`PRJ-`, `Д-`, `С-`-random) убираются/выравниваются.
- **Автосоздание:** при перемещении сделки на стадию `code==='contract'` и пустом `projectId` → создать проект+договор (если есть `contactId`, иначе ошибка без смены стадии).
- **Новый роут** `POST /api/deals/[id]/convert-to-project` — единое действие (проект+договор+общий номер+смена стадии).

### Дни до конца проекта (CRM-03)
- API `/api/deals` подтягивает `Project { id, endDate, externalNumber }`; карточка показывает «N дн.» через существующий `getDeadlineInfo` (overdue/soon/upcoming). Источник даты — `project.endDate` (после конвертации), до — `expectedCloseDate` сделки.

### Claude's Discretion
- Детали UI модалок, точное форматирование чисел/дат — на усмотрение Claude (следуя существующим shadcn/ui паттернам).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Модели готовы:** `Deal` (lossReason, contractId, projectId, closedAt, actualCloseDate), `DealStage` (isWonStage, isLostStage), `LeadSource` (id, code @unique, name, description, isActive), `Contract`, `Project` (externalNumber @unique).
- **Воронка засеяна корректно:** 8 стадий (new/qualified/meeting/proposal/negotiation/contract/won[isWonStage]/lost[isLostStage]). Стадия `contract` (code) — триггер автосоздания.
- **`deals.moveStage`** уже пишет DealHistory и проставляет closedAt/actualCloseDate для won/lost — расширяется lossReason.
- **`create-project/route.ts:48-51`** уже генерирует `ПМ-{year}-{NNNNN}` (последовательный!) — но `projects.ts:153` (PRJ-random) и `contracts.ts:53` (Д-random) рассинхронизированы.
- **dnd-kit канбан** работает; `getDeadlineInfo` в `lib/utils` — переиспользуется.
- **shadcn/ui Select/Dialog** — для UI.

### Patterns
- API routes: `GET/POST /api/resource`, `GET/PATCH/DELETE /api/resource/[id]`; PascalCase Prisma relations → lowercase API shape в маппере.
- requireSession() для авторизации; changedBy из session (anti-forgery).

</code_context>
