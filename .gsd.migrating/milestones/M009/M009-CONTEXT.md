# M009: Сделки и контракты

**Gathered:** 2026-06-21  
**Status:** Ready for planning

## Project Description

Объединённая CRM-система для управления закупками, финансами, сделками, проектами и контрактами. M009 добавляет модуль управления продажами от лида до подписанного договора.

## Why This Milestone

**What problem this solves:** Без модуля сделок и контрактов менеджеры не могут вести воронку продаж, отслеживать стадии переговоров и оформлять договоры. R011 (сделки) и R012 (контракты) — core capabilities CRM.

**Why now:** Базовая CRM (M002) с контактами уже готова. Следующий логический шаг — связать контакты с процессом продажи.

## User-Visible Outcome

### When this milestone is complete, the user can:

- Создавать сделки и привязывать их к контактам
- Видеть все сделки в виде kanban-доски по этапам (new → qualified → meeting → proposal → negotiation → contract → won/lost)
- Перетаскивать сделки между этапами с автоматической записью в историю
- Конвертировать выигранную сделку в контракт одним кликом
- Видеть детальную страницу сделки с полной историей перемещений между этапами
- Просматривать список контрактов с фильтрами
- Просматривать детальную страницу контракта с версиями и подписантами

### Entry point / environment

- Entry point: `/deals` (kanban board), `/deals/[id]` (deal detail), `/contracts` (contracts list), `/contracts/[id]` (contract detail)
- Environment: browser (Next.js app)
- Live dependencies: SQLite (dev) / PostgreSQL (prod), Prisma ORM

## Completion Class

- Contract complete means: API routes работают, Repository методы протестированы, UI компоненты рендерятся без ошибок
- Integration complete means: Drag-and-drop на kanban обновляет stage в БД и пишет DealHistory; конвертация сделки создаёт Contract и связывает Deal с Contract
- Operational complete means: Seed script создаёт pipeline и stages; ошибки API показываются пользователю; загрузочные состояния отображаются

## Final Integrated Acceptance

To call this milestone complete, we must prove:

1. Создаём сделку через CreateDealModal — она появляется на kanban в первом этапе
2. Перетаскиваем сделку в другой этап — обновляется в БД, записывается в DealHistory
3. Кликаем "Convert to Contract" на сделке — создаётся контракт, Deal связывается с Contract
4. Открываем детальную страницу сделки — видим timeline истории перемещений
5. Открываем детальную страницу контракта — видим версии и подписантов

## Architectural Decisions

### Deal History Tracking

**Decision:** Использовать отдельную таблицу DealHistory для записи каждого перемещения сделки между этапами.

**Rationale:** Позволяет восстановить полную аудиторскую trailed того, как шла сделка. DealHistory хранит fromStageId, toStageId, comment, changedBy, changedAt.

**Alternatives Considered:**
- Хранить историю в JSON-поле Deal — нельзя эффективно запросить или отфильтровать
- Event sourcing / audit log — overkill для текущих требований

### Contract Versioning

**Decision:** Использовать отдельную таблицу ContractVersion с инкрементальным номером версии.

**Rationale:** Контракты часто обновляются (новые условия, цены). Версионность позволяет увидеть, что менялось, и откатиться при необходимости.

**Alternatives Considered:**
- Хранить только текущую версию — потеря истории изменений
- Отдельная таблица для каждого контракта — слишком сложно для миграций

### Deal → Contract Conversion

**Decision:** Метод convertFromDeal в ContractRepository, который создаёт Contract из Deal и устанавливает bidirectional link (deal.contractId, contract.dealId).

**Rationale:** Сделка и контракт связаны жизненным циклом — контракт рождается из сделки. Bidirectional link позволяет быстро находить сделку по контракту и наоборот.

**Alternatives Considered:**
- Только dealId на Contract — нельзя найти контракт, глядя на сделку
- Отдельная junction table — overkill, это 1:1 отношение

### Soft Delete Pattern

**Decision:** Использовать deletedAt timestamp вместо физического удаления для Deal и Contract.

**Rationale:** Восстановление mistakenly deleted сделок/контрактов; аудит trailing; статистика не ломается после удаления.

## Error Handling Strategy

**API errors:** Repository выбрасывает Error с описанием ("Deal with id X not found"). API route возвращает 404/400 с message.

**Stage transition:** Если Deal не существует или уже deleted, moveStage выбрасывает Error. Frontend показывает toast/alert и revert optimistic update.

**Contract conversion:** Если contract уже существует для deal, выбрасывается Error. Frontend показывает сообщение и не даёт конвертировать дважды.

**Validation errors:** Prisma validation errors (например, missing required fields) пробрасываются как 400 с описанием.

## Risks and Unknowns

- **Kanban performance** — Как behaves kanban с 100+ сделками? Need pagination или virtualization.
- **History timeline UI** — Как оптимально отобразить историю? Infinite scroll или limit + load more?
- **Contract statuses** — Сейчас только draft. Нужен ли workflow (draft → sent → signed → active)?

## Existing Codebase / Prior Art

- `apps/web/src/lib/db/deals.ts` — DealRepository с CRUD, moveStage, getHistory
- `apps/web/src/lib/db/contracts.ts` — ContractRepository с CRUD, addVersion, addSigner, convertFromDeal
- `apps/web/src/lib/api/deals.ts` — dealsApi client
- `apps/web/src/app/deals/page.tsx` — kanban board с FilterBar, CreateDealModal
- `apps/web/prisma/seed-deals.ts` — создаёт default pipeline с 8 stages
- `apps/web/src/components/deals/` — KanbanBoard, FilterBar, CreateDealModal components

## Relevant Requirements

- **R011** — Модуль сделки: pipeline, этапы, статусы (primary owner: M009)
- **R012** — Модуль контракты: документы, этапы, подписи (primary owner: M009)

## Scope

### In Scope

- Deal CRUD с привязкой к Contact и Pipeline/Stage
- Kanban-доска с drag-and-drop между stage
- DealHistory для аудита перемещений
- Deal detail page с timeline истории
- Contract CRUD с версионностью
- ContractSigner для подписантов с датами подписания
- ContractTemplate (seed) для базовых шаблонов
- Convert Deal → Contract
- Contract list page с фильтрами
- Contract detail page с tabs (основное, версии, подписанты)

### Out of Scope / Non-Goals

- Автоматическая генерация PDF из контракта (будет в следующих milestone)
- Email уведомления при изменении stage (M008)
- Интеграция с Google Calendar для встреч по сделкам (M001 уже покрывает)
- Кастомизация pipeline (пользовательские этапы) — только hardcoded seed

## Technical Constraints

- SQLite для development (Docker Desktop недоступен), PostgreSQL для production
- Prisma 6.6.0 (locked из-за breaking changes в 7.x)
- Next.js 16 с App Router
- shadcn/ui для UI компонентов

## Integration Points

- **Contact module** (M002) — Deal.contactId ссылается на Contact. На детальной странице сделки показываем ссылку на контакт.
- **Task/Event modules** (M001) — Task и Event могут быть привязаны к Deal (dealId). На detail page можно показывать связанные задачи/события (out of scope для M009).
- **Project module** (M004, future) — Проект может быть создан из контракта (project.contractId).

## Testing Requirements

- Unit тесты для DealRepository и ContractRepository (findMany, create, update, moveStage, convertFromDeal)
- Integration тесты для API routes (POST /deals, PUT /deals/[id]/move, POST /deals/[id]/convert)
- E2E тест (опционально): создать сделку → переместить → конвертировать в контракт

## Acceptance Criteria

### Per-slice acceptance criteria:

**S01 (Deal Repository & API):**
- DealRepository.create генерирует UUID и number в формате С-YYYY-NNNNN
- DealRepository.moveStage создаёт запись в DealHistory
- API route POST /deals создаёт сделку и возвращает 201
- API route PUT /deals/[id]/move обновляет stage и возвращает обновлённый deal

**S02 (Kanban Board):**
- /deals page рендерит KanbanBoard с колонками по stage order
- Drag-and-drop между колонками вызывает API move
- FilterBar фильтрует по status (all/open/closed)
- CreateDealModal создаёт сделку и обновляет список

**S03 (Deal Detail Page):**
- /deals/[id] page показывает deal card с контактами, amount, dates
- Timeline показывает DealHistory отсортированный по changedAt desc
- Каждое событие в timeline показывает fromStage → toStage, changedBy, comment

**S04 (Contract Repository & Convert):**
- ContractRepository.create генерирует UUID и number в формате Д-YYYY-NNNNN
- ContractRepository.addVersion инкрементирует version number
- ContractRepository.convertFromDeal создаёт Contract и обновляет Deal.contractId
- API route POST /deals/[id]/convert возвращает созданный контракт

**S05 (Contract Pages):**
- /contracts page рендерит список контрактов с фильтрами
- /contracts/[id] page показывает tabs: Overview, Versions, Signers
- Versions tab показывает список версий с номерами и датами
- Signers tab показывает таблицу подписантов с датами подписания

## Open Questions

- **Pagination на kanban:** Нужна ли lazy loading для сделок? (текущий дизайн загружает все)
- **Contract status workflow:** Нужен ли статусный machine или достаточно status draft/signed?
- **History timeline depth:** Ограничивать ли историю N последними записями?