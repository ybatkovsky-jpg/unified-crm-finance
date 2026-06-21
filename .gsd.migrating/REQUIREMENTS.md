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

### R010 — CRM модуль: компании, контакты, задачи, события
- Class: core-capability
- Status: active
- Description: CRM модуль: компании, контакты, задачи, события
- Why it matters: Базовая CRM функциональность для работы с клиентами
- Source: inferred
- Primary owning slice: M002

### R011 — Модуль сделки: pipeline, этапы, статусы
- Class: core-capability
- Status: active
- Description: Модуль сделки: pipeline, этапы, статусы
- Why it matters: Управление продажами от лида до закрытия
- Source: inferred
- Primary owning slice: M003

### R012 — Модуль контракты: документы, этапы, подписи
- Class: core-capability
- Status: active
- Description: Модуль контракты: документы, этапы, подписи
- Why it matters: Юридическое оформление сделок
- Source: inferred
- Primary owning slice: M003

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
| R010 | core-capability | active | M002 | none | unmapped |
| R011 | core-capability | active | M003 | none | unmapped |
| R012 | core-capability | active | M003 | none | unmapped |
| R013 | core-capability | active | M004 | none | unmapped |
| R014 | core-capability | active | M005 | none | unmapped |
| R015 | core-capability | active | M006 | none | unmapped |
| R016 | differentiator | active | M007 | none | unmapped |
| R017 | failure-visibility | active | M008 | none | unmapped |

## Coverage Summary

- Active requirements: 15
- Mapped to slices: 15
- Validated: 2 (R004, R007)
- Unmapped active requirements: 0
