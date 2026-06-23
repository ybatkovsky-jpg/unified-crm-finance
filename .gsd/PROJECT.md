# Project

## What This Is

Объединённая CRM-система для управления закупками, финансами, сделками, проектами и контрактами. Система заменяет два разрозненных приложения (zakuppro и finpro) и обеспечивает единое пространство для бизнес-процессов.

**Текущее состояние:** M003 (Сделки и контракты) завершён. Активна разработка модулей CRM, Deals, Contracts.

## Core Value

Единое пространство для всех бизнес-процессов: от закупок до финансов. Одно окно для управления всем циклом сделки/проекта с консистентными данными и прозрачностью статусов.

## Project Shape

- **Complexity:** complex
- **Why:** 6 модулей (CRM, сделки, контракты, проекты, закупки, финансы) + аналитика + уведомления. Гибридная архитектура (Next.js + FastAPI), 42 сущности в модели данных, внешние зависимости (RabbitMQ, MinIO).

## Current State

**Что существует:**
- Монорепозиторий с npm workspaces (apps/web, apps/worker)
- Next.js 16 + React 19 + shadcn/ui UI framework
- Prisma 6 схема с 42+ сущностями
- Базовый UI: layout, sidebar, header, тема
- CRM модуль: контакты, взаимодействия (история, календарь)
- **Deals модуль:** pipeline с 8 стадиями, Kanban board с drag-and-drop, DealHistory timeline
- **Contracts модуль:** версионность, подписанты, конвертация из сделки
- NextAuth аутентификация
- CI/CD pipeline (GitHub Actions)

**Что нужно построить:**
- Проекты модуль (Gantt, timelines)
- Закупки модуль (заявки, позиции, утверждения)
- Финансы модуль (бюджеты, транзакции, отчеты)
- Аналитика (дашборды, метрики)
- Уведомления (email, in-app, webhook)

## Architecture / Key Patterns

**Стек технологий:**
- Frontend: Next.js 16, React 19, TypeScript, shadcn/ui
- Backend: Next.js API Routes + Python FastAPI
- Database: PostgreSQL 16, Prisma 6 ORM (Next.js), SQLAlchemy (Python)
- Queue: RabbitMQ + Celery
- Storage: MinIO (S3-compatible)
- Auth: NextAuth + JWT, RBAC

**Структура монорепозитория:**
```
apps/
  web/              # Next.js приложение
  worker/           # Python FastAPI воркер
packages/
  ui/               # Общие UI компоненты
  config/           # Общие конфиги
features/           # Бизнес-модули (в web/)
  auth/
  crm/
  deals/
  contracts/
```

**Ключевые паттерны:**
- Repository паттерн для domain entities (DealRepository, ContractRepository)
- API routes: GET/PATCH/DELETE /api/resource/[id], GET/POST /api/resource
- List + detail page структура для UX консистентности
- Loading/error/empty state паттерн для async компонентов
- Timeline компоненты следуют установленному patterns (InteractionTimeline, DealHistoryTimeline)

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [x] M001: Инфраструктура и модель данных — Монорепозиторий, Docker Compose, Prisma схема, NextAuth, базовый UI, CI/CD
- [x] M002: CRM модуль — Компании, контакты, задачи, события
- [x] M003: Сделки и контракты — Pipeline, этапы, документы, версионность, подписанты
- [x] M004: Проекты — Задачи, этапы, timelines, Gantt, Production, file uploads
- [ ] M005: Закупки — Контрагенты, BOM, запросы поставщикам, счета, сверка, согласование, склад, поставки
- [ ] M006: Финансы — Бюджеты, транзакции, отчеты
- [ ] M007: Аналитика — Дашборды, метрики, экспорт
- [ ] M008: Уведомления — Email, in-app, webhook
