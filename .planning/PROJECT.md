# Project

## What This Is

Объединённая CRM-система для управления закупками, финансами, сделками, проектами и контрактами. Система заменяет два разрозненных приложения (zakuppro и finpro) и обеспечивает единое пространство для бизнес-процессов.

**Текущее состояние:** M003 (Сделки и контракты) завершён. Активна разработка модулей CRM, Deals, Contracts.

## Current Milestone: v1.0 «ERP ПРО Мебель — доводка до спеки»

**Goal:** Довести единый ERP до продуктового ТЗ — авторизация и RBAC, редизайн UI (левый сайдбар + поднав), стабилизация ядра, CRM-сделки, полный операционный цикл проекта (закупки/производство/монтаж), финансы, управленческий учёт.

**Target features:** AUTH, UI-редизайн, стабилизация, CRM, проектный цикл (PROJ), финансы (FIN), управленческий учёт (ACCT), платформа (задачи/уведомления/аналитика).

> ⚠️ **Внимание:** ниже в «Current State» и «Milestone Sequence» заявлено, что M001–M008 «готовы» (NextAuth, sidebar и т.д.). Это **протухшие/фиктивные** заявки. Реальное состояние: авторизации НЕТ (middleware-заглушка), create-потоки сделки/проекта/инвойса падают, ~40 ошибок типов в прод-коде + ~298 битых тестов, UI — top-bar (нужен редизайн). **Источник правты о реальных пробелах:** `REQUIREMENTS.md` (этот milestone) и `.gsd/integration/PRODUCT-SPEC.md`.

Last updated: 2026-06-29

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
- [x] M005: Закупки — Контрагенты, BOM, запросы поставщикам, счета, сверка, согласование, склад, поставки
- [x] M006: Финансы — Бюджеты, транзакции, отчеты
- [x] M007: Аналитика — Дашборды, метрики, экспорт
- [x] M008: Уведомления — Email, in-app, webhook
