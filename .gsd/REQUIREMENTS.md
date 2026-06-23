# Requirements

This file is the explicit capability and coverage contract for the project.

## Active

### R001 — Монорепозиторий с npm workspaces (apps/web, apps/worker, packages/*) для удобной модульной разработки
- Class: launchability
- Status: active
- Description: Монорепозиторий с npm workspaces (apps/web, apps/worker, packages/*) для удобной модульной разработки
- Why it matters: Необходим для объединения кодовой базы и совместной разработки
- Source: user
- Primary owning slice: M001/S01

### R002 — Docker Compose для всех сервисов (PostgreSQL, RabbitMQ, MinIO, web, worker) одной командой
- Class: launchability
- Status: active
- Description: Docker Compose для всех сервисов (PostgreSQL, RabbitMQ, MinIO, web, worker) одной командой
- Why it matters: Обеспечивает единый environment для разработки и продакшена
- Source: user
- Primary owning slice: M001/S01

### R003 — Prisma схема по спецификации docs/05-data-model.md (42 сущности) с миграциями
- Class: core-capability
- Status: active
- Description: Prisma схема по спецификации docs/05-data-model.md (42 сущности) с миграциями
- Why it matters: Единая модель данных — основа для всех модулей
- Source: user
- Primary owning slice: M001/S02

### R005 — Базовый UI с shadcn/ui (layout, sidebar, header, тема)
- Class: quality-attribute
- Status: active
- Description: Базовый UI с shadcn/ui (layout, sidebar, header, тема)
- Why it matters: Консистентный дизайн и UX для всех модулей
- Source: user
- Primary owning slice: M001/S04
- Validation: shadcn/ui initialized with components.json and utils; ThemeProvider integrated; sidebar and header components created; DashboardLayout wraps dashboard page

### R006 — FastAPI worker с RabbitMQ consumer для фоновой обработки задач
- Class: core-capability
- Status: active
- Description: FastAPI worker с RabbitMQ consumer для фоновой обработки задач
- Why it matters: Асинхронная обработка (экспорт, уведомления, расчёты)
- Source: user
- Primary owning slice: M001/S05

### R008 — ADR-01: Гибридная архитектура (Next.js API Routes + Python FastAPI) зафиксирована
- Class: constraint
- Status: active
- Description: ADR-01: Гибридная архитектура (Next.js API Routes + Python FastAPI) зафиксирована
- Why it matters: Архитектурное решение должно быть задокументировано
- Source: user
- Primary owning slice: M001/S01

### R009 — ADR-02: Модель данных (Prisma + SQLAlchemy консистентность) зафиксирована
- Class: constraint
- Status: active
- Description: ADR-02: Модель данных (Prisma + SQLAlchemy консистентность) зафиксирована
- Why it matters: Консистентность моделей критична для гибридной архитектуры
- Source: user
- Primary owning slice: M001/S02

### R013 — Модуль проекты: задачи, этапы, timelines, Gantt
- Class: core-capability
- Status: active
- Description: Модуль проекты: задачи, этапы, timelines, Gantt
- Why it matters: Управление проектами и сроками
- Source: inferred
- Primary owning slice: M004

### R014 — Модуль закупки: заявки, позиции, утверждения, поставщики
- Class: core-capability
- Status: active
- Description: Модуль закупки: заявки, позиции, утверждения, поставщики
- Why it matters: Управление закупочными процессами
- Source: inferred
- Primary owning slice: M005
- Notes: M005 active with 7 planned slices: S01 Counterparty, S02 BOM, S03 Purchase Requests, S04 Invoices, S05 Approvals, S06 Warehouse, S07 Delivery

### R015 — Модуль финансы: бюджеты, транзакции, счета, отчеты
- Class: core-capability
- Status: active
- Description: Модуль финансы: бюджеты, транзакции, счета, отчеты
- Why it matters: Финансовый контроль и отчётность
- Source: inferred
- Primary owning slice: M006

### R016 — Аналитика: дашборды, метрики, графики, экспорт
- Class: differentiator
- Status: active
- Description: Аналитика: дашборды, метрики, графики, экспорт
- Why it matters: Прозрачность и понимание состояния бизнеса
- Source: inferred
- Primary owning slice: M007

### R017 — Уведомления: email, in-app, webhook для критичных событий
- Class: failure-visibility
- Status: active
- Description: Уведомления: email, in-app, webhook для критичных событий
- Why it matters: Пользователи узнают о важных событиях вовремя
- Source: inferred
- Primary owning slice: M008

### R018 — Google Calendar two-way sync: события CRM ↔ Google Calendar
- Class: integration
- Status: active
- Description: Google Calendar two-way sync: события CRM ↔ Google Calendar
- Why it matters: Пользователи работают в Google Calendar — нужна双向 синхронизация встреч, напоминаний, задач с deadline
- Source: User requirement
- Primary owning slice: M001
- Supporting slices: []
- Validation: Создание встречи в CRM отображается в Google Calendar и наоборот

### R019 — События: история взаимодействий и календарь встреч
- Class: core-capability
- Status: active
- Description: События: история взаимодействий и календарь встреч
- Why it matters: CRM без истории взаимодействий бесполезен — нельзя отследить коммуникацию с клиентом
- Source: User requirement
- Primary owning slice: M001
- Supporting slices: []
- Validation: Создание события привязано к контакту, отображается в календаре, есть фильтры по типу и дате

### R020 — Задачи: задачи на взаимодействия с клиентом + внутренние задачи компании
- Class: core-capability
- Status: active
- Description: Задачи: задачи на взаимодействия с клиентом + внутренние задачи компании
- Why it matters: Нужно разделять клиентские задачи (перезвонить, отправить КП) и внутренние (подготовить отчёт, approve закупку)
- Source: User requirement
- Primary owning slice: M001
- Supporting slices: []
- Validation: Есть два типа задач с разными вью-списками, фильтрами и workflow

## Validated

### R004 — NextAuth + JWT для аутентификации (login/logout/refresh token)
- Class: primary-user-loop
- Status: validated
- Description: NextAuth + JWT для аутентификации (login/logout/refresh token)
- Why it matters: Первое что делает пользователь — логинится в систему
- Source: user
- Primary owning slice: M001/S03
- Validation: Login page exists at /login, NextAuth API routes configured at /api/auth/*, middleware protects /dashboard/* with redirects, logout functional via server action

### R007 — CI/CD pipeline (GitHub Actions: lint, typecheck, test, build)
- Class: operability
- Status: validated
- Description: CI/CD pipeline (GitHub Actions: lint, typecheck, test, build)
- Why it matters: Автоматическая проверка качества кода и деплой
- Source: user
- Primary owning slice: M001/S06
- Validation: GitHub Actions workflows created at .github/workflows/ci.yml and .github/workflows/deploy.yml; pytest tests pass (5/5); ruff lint passes clean; deployment documentation complete

### R010 — CRM модуль: компании, контакты, задачи, события
- Class: core-capability
- Status: validated
- Description: CRM модуль: компании, контакты, задачи, события
- Why it matters: Базовая CRM функциональность для работы с клиентами
- Source: inferred
- Primary owning slice: M002
- Validation: Contact CRUD API (S01), Contact List UI (S02), Interactions API & UI (S03), Contact Detail Page (S04) — 100+ тестов pass, zero build errors, dev server verified

### R011 — Модуль сделки: pipeline, этапы, статусы
- Class: core-capability
- Status: validated
- Description: Модуль сделки: pipeline, этапы, статусы
- Why it matters: Управление продажами от лида до закрытия
- Source: inferred
- Primary owning slice: M009
- Validation: S01: 78 tests passed (34 repo + 44 API); S02: Kanban Board with 8 stages, drag-drop; S03: DealHistoryTimeline integrated; S04: Transaction-safe deal→contract conversion

### R012 — Модуль контракты: документы, этапы, подписи
- Class: core-capability
- Status: validated
- Description: Модуль контракты: документы, этапы, подписи
- Why it matters: Юридическое оформление сделок
- Source: inferred
- Primary owning slice: M009
- Validation: S04: ContractRepository with transaction safety, 57 tests (16 repo + 41 API); versioning with MAX+1 pattern; signer management; bidirectional deal→contract link

## Deferred

## Out of Scope

## Traceability

| ID | Class | Status | Primary owner | Supporting | Proof |
|---|---|---|---|---|---|
| R001 | launchability | active | M001/S01 | none | unmapped |
| R002 | launchability | active | M001/S01 | none | unmapped |
| R003 | core-capability | active | M001/S02 | none | unmapped |
| R004 | primary-user-loop | validated | M001/S03 | none | Login page exists at /login, NextAuth API routes configured at /api/auth/*, middleware protects /dashboard/* with redirects, logout functional via server action |
| R005 | quality-attribute | active | M001/S04 | none | shadcn/ui initialized with components.json and utils; ThemeProvider integrated; sidebar and header components created; DashboardLayout wraps dashboard page |
| R006 | core-capability | active | M001/S05 | none | unmapped |
| R007 | operability | validated | M001/S06 | none | GitHub Actions workflows created at .github/workflows/ci.yml and .github/workflows/deploy.yml; pytest tests pass (5/5); ruff lint passes clean; deployment documentation complete |
| R008 | constraint | active | M001/S01 | none | unmapped |
| R009 | constraint | active | M001/S02 | none | unmapped |
| R010 | core-capability | validated | M002 | none | Contact CRUD API (S01), Contact List UI (S02), Interactions API & UI (S03), Contact Detail Page (S04) — 100+ тестов pass, zero build errors, dev server verified |
| R011 | core-capability | validated | M009 | none | S01: 78 tests passed (34 repo + 44 API); S02: Kanban Board with 8 stages, drag-drop; S03: DealHistoryTimeline integrated; S04: Transaction-safe deal→contract conversion |
| R012 | core-capability | validated | M009 | none | S04: ContractRepository with transaction safety, 57 tests (16 repo + 41 API); versioning with MAX+1 pattern; signer management; bidirectional deal→contract link |
| R013 | core-capability | active | M004 | none | unmapped |
| R014 | core-capability | active | M005 | none | unmapped |
| R015 | core-capability | active | M006 | none | unmapped |
| R016 | differentiator | active | M007 | none | unmapped |
| R017 | failure-visibility | active | M008 | none | unmapped |
| R018 | integration | active | M001 | [] | Создание встречи в CRM отображается в Google Calendar и наоборот |
| R019 | core-capability | active | M001 | [] | Создание события привязано к контакту, отображается в календаре, есть фильтры по типу и дате |
| R020 | core-capability | active | M001 | [] | Есть два типа задач с разными вью-списками, фильтрами и workflow |

## Coverage Summary

- Active requirements: 15
- Mapped to slices: 15
- Validated: 5 (R004, R007, R010, R011, R012)
- Unmapped active requirements: 0
