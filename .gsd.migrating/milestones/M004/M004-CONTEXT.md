# M004: Проекты

**Gathered:** 2026-06-22
**Status:** Ready for planning

## Project Description

Модуль управления проектами — параллельная lifetime со сделкой система для tracking исполнения контрактов. Проект создаётся на этапе "Подписан контракт" в сделке и существует независимо от коммерческого pipeline сделки. Проект содержит этапы исполнения (разработка, спецификация, закупки, производство, монтаж, акт), команду проекта с множественными ролями на одного пользователя, и отдельные Production сущности с собственным pipeline для производства плитных материалов и столешниц из камня.

## Why This Milestone

Сделка (Deal) — это коммерческий процесс (pipeline, этапы воронки), но реальная работа продолжается после подписания контракта. Нужна отдельная сущность для tracking исполнения по стадиям, параллельного управления производством (два типа: плиты, столешницы), спецификациями для раскроя, и команды проекта. Акт выполненных работ закрывает проект и/или сделку (cascade).

## User-Visible Outcome

### When this milestone is complete, the user can:

- Создавать проект из detail page сделки (на этапе контракта) или отдельно через список проектов
- Видеть список всех проектов с фильтрами по статусу, менеджеру, дате
- Управлять этапами проекта (8 стандартных этапов с датами и статусами)
- Назначать команду проекта с возможностью множественных ролей на одного пользователя
- Визуализировать timeline проекта через Gantt диаграмму (drag & drop дат, цветовая кодировка по статусу)
- Создавать Production сущности внутри проекта (типы: плиты, столешницы) с собственным pipeline этапов
- Прикреплять файлы к сделкам (чертежи, акты) и проектам (спецификации производства)
- Закрывать проект актом выполненных работ — автоматом закрывается сделка

### Entry point / environment

- Entry point: `/dashboard/projects` (список), `/dashboard/projects/[id]` (detail), `/dashboard/deals/[id]` (кнопка "Создать проект")
- Environment: local dev / browser
- Live dependencies involved: MinIO (file storage), SQLite/PostgreSQL (database)

## Completion Class

- Contract complete means: All API endpoints work (Project CRUD, ProjectStage, ProjectMember, Production), Repository tests pass, UI components render
- Integration complete means: Project ↔ Deal (создание из сделки, cascade close), Project ↔ Contract (привязка), Project ↔ Contact (клиент), FileEntity upload/preview
- Operational complete means: Gantt drag & drop работает, file upload с preview, multiple roles per user functional, production stages tracking

## Final Integrated Acceptance

To call this milestone complete, we must prove:

- Пользователь может создать проект из сделки (на этапе контракта) и увидеть его в списке проектов
- Gantt timeline показывает этапы проекта с корректными датами и цветовой кодировкой по статусу
- Пользователь может создать Production сущность, добавить этапы производства, и tracking процесс до поставки на объект
- File upload работает: drag & drop, preview, удаление. Чертежи прикрепляются к сделке, спецификации к проекту
- Cascade close: акт закрывает проект → сделка закрывается автоматически (или наоборот)

## Architectural Decisions

### Production как отдельная сущность

**Decision:** Production — это отдельная model в Prisma схеме (1:N к Project), не просто тип ProjectStage

**Rationale:** Производство имеет собственный pipeline (этапы до поставки на объект), может быть несколько на один проект, и отличается от основных этапов проекта. Типы: PLATE (плитные материалы), COUNTERTOP (столешницы из кварца/акрила). Нужна отдельная сущность для tracking статуса производства независимо от статуса проекта.

**Alternatives Considered:**
- Использовать ProjectStage с type: PRODUCTION — не подходит, т.к. нужно несколько production tracks на один проект
- Production как атрибут Project — не подходит для нескольких производств на проект

### ProjectMember с мульти-ролями

**Decision:** Один пользователь может иметь несколько ролей в одном проекте через множественные ProjectMember записи (снимается `@@unique([projectId, userId])`)

**Rationale:** В одной команде пользователь может быть одновременно и менеджером, и технологом, и исполнителем. Это business requirement, а не ошибка данных.

**Alternatives Considered:**
- Одна роль на пользователя — restricts business flexibility
- Json массив ролей в одной записи — сложнее query и filter

### Gantt реализация с vis-timeline

**Decision:** Использовать библиотеку `vis-timeline` для MVP Gantt с drag & drop дат, цветовой кодировкой по статусу, масштабом в дни

**Rationale:** `vis-timeline` проверена, работает без тяжелых зависимостей, покрывает MVP requirement. Critical path, resource leveling, export PDF — отложены на M007 (Аналитика).

**Alternatives Considered:**
- `@xplan/react-gantt` — меньше community support
- Full custom implementation — слишком дорого для M004

### File attachments через FileEntity

**Decision:** Использовать существующую FileEntity model с MinIO storage. UI для upload с drag & drop, preview, удаление.

**Rationale:** FileEntity уже существует в схеме. Не нужно новой инфраструктуры. Просто нужна UI интеграция.

**Alternatives Considered:**
- Новая file storage система — избыточно
- Base64 в БД — не подходит для больших файлов

### Cascade close логика

**Decision:** Акт выполненных работ может закрыть либо проект, либо сделку. Другая сущность закрывается автоматически (cascade).

**Rationale:** Гибкость для разных business процессов. Иногда акт = завершение проекта (сделка follows), иногда акт = завершение сделки (проект follows).

**Alternatives Considered:**
- Акт закрывает только проект — restricts workflows
- Акт закрывает только сделку — не подходит для project-centric view

## Error Handling Strategy

- Project creation без обязательных полей — валидация на UI и API с понятными ошибками
- File upload failures — retry mechanism, user-friendly error messages (size limit, format)
- Gantt date conflicts — warning UI, но allow сохранение (пользователь может решить)
- Cascade close failures — rollback с подробным логом (почему сделка не закрылась)
- Production stage dependencies — если предыдущий этап не завершён, warning на следующем этапе

## Risks and Unknowns

- **File upload scope** — большой компонент. Нужно убедиться, что MinIO настроен корректно в dev.
- **Production pipeline** — новая сложная сущность с зависимостями. Может потребоваться дополнительная schema migration.
- **Gantt интерактивность** — drag & drop timelines может быть сложно тестируемо. Нужна manual verification.
- **Cascade close** — bidirectional dependency может создать race conditions. Нужна transaction safety.

## Existing Codebase / Prior Art

- `apps/web/prisma/schema.prisma` — Project, ProjectStage, ProjectMember, BOM, BOMItem модели уже существуют
- `apps/web/features/deals/` — DealRepository pattern, Kanban board implementation — использовать как template
- `apps/web/features/contracts/` — Contract detail page с timeline — реюз для project detail
- `.gsd/milestones/M003/` — Сделки и контракты milestone: Repository pattern, list/detail pages, integration patterns
- `FileEntity` model — уже существует в схеме, используется в Contract, Interaction

## Relevant Requirements

- **R013** — Модуль проекты: задачи, этапы, timelines, Gantt (primary owning slice: M004)

## Scope

### In Scope

- Project CRUD (создание из сделки + отдельно)
- ProjectStage pipeline (8 стандартных этапов: разработка проекта, спецификация, запрос счетов у поставщиков, комплектация заказов для производства, производство (плиты/столешницы), доставка на объект, монтаж на адресе заказчика, подписание акта)
- ProjectMember management (множественные роли на одного пользователя)
- Gantt timeline visualization (vis-timeline, drag & drop дат, цвет по статусу, масштаб дни)
- Production entity + ProductionStage (типы: PLATE, COUNTERTOP, несколько на проект)
- File upload UI (drag & drop, preview, delete)
- File attachments: чертежи в сделки, акты в сделки, спецификации в проекты
- Cascade close: акт → проект/сделка → cascade

### Out of Scope / Non-Goals

- Task Manager (организационные задачи) — отдельная сущность, не в M004
- Gantt advanced features (critical path, resource leveling, export PDF) — M007
- Production planning (BOM optimization) — M005 (Закупки)
- Финансовая отчетность по проектам — M006 (Финансы)

## Technical Constraints

- Prisma 6.6.0 (locked из-за breaking changes в 7.x)
- SQLite для dev, PostgreSQL для production
- Next.js 16, React 19, shadcn/ui для UI
- MinIO для file storage (S3-compatible)

## Integration Points

- **Deal** — создание проекта на этапе контракта, cascade close через акт
- **Contract** — привязка проекта к контракту
- **Contact** — клиент проекта
- **FileEntity** — storage для чертежей, актов, спецификаций
- **BOM/BOMItem** — спецификации проекта (уже существует в схеме)
- **User/Role** — команда проекта, RBAC

## Testing Requirements

- Unit tests для ProjectRepository, ProjectMemberRepository, ProductionRepository
- API integration tests для всех endpoints
- E2E tests для critical flows: create project from deal, close project with act, file upload
- Manual verification для Gantt drag & drop (сложно автоматизировать)

## Acceptance Criteria

Per-slice acceptance criteria will be defined during planning.

## Open Questions

- None — resolved via discussion