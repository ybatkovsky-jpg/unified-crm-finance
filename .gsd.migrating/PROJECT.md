# Project

## What This Is

Объединённая CRM-система для управления закупками, финансами, сделками, проектами и контрактами. Система заменяет два разрозненных приложения (zakuppro и finpro) и обеспечивает единое пространство для бизнес-процессов.

**Текущее состояние:** Спецификация (Draft v0.1.0) готова. Начало разработки — M001 (Инфраструктура и модель данных).

## Core Value

Единое пространство для всех бизнес-процессов: от закупок до финансов. Одно окно для управления всем циклом сделки/проекта с консистентными данными и прозрачностью статусов.

## Project Shape

- **Complexity:** complex
- **Why:** 6 модулей (CRM, сделки, контракты, проекты, закупки, финансы) + аналитика + уведомления. Гибридная архитектура (Next.js + FastAPI), 42 сущности в модели данных, внешние зависимости (RabbitMQ, MinIO).

## Current State

**Что существует:**
- Спецификация в docs/ (19 файлов)
- Репозитории-предшественники: zakuppro (Python/FastAPI + Next.js), finpro (Next.js + Prisma)
- Сервер: 64.188.56.25 (пустой, готов к деплою)

**Что нужно построить:**
- Монорепозиторий с feature-sliced структурой
- Docker Compose окружение
- Единая модель данных на PostgreSQL
- Web-интерфейс на Next.js с shadcn/ui
- Python worker для фоновой обработки
- CI/CD и автодеплой

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
  db/               # Prisma client и типы
features/           # Бизнес-модули (в web/)
  auth/
  crm/
  deals/
  finance/
  ...
```

**Ключевые паттерны:**
- Feature-sliced дизайн для модульности
- Docker Compose для локальной разработки и проды
- Health checks для всех сервисов
- CI/CD через GitHub Actions
- Autodeploy через Coolify

## Capability Contract

See `.gsd/REQUIREMENTS.md` for the explicit capability contract, requirement status, and coverage mapping.

## Milestone Sequence

- [ ] M001: Инфраструктура и модель данных — Монорепозиторий, Docker Compose, Prisma схема, NextAuth, базовый UI, CI/CD
- [ ] M002: CRM модуль — Компании, контакты, задачи, события
- [ ] M003: Сделки и контракты — Pipeline, этапы, документы
- [ ] M004: Проекты — Задачи, этапы, timelines
- [ ] M005: Закупки — Заявки, позиции, утверждения
- [ ] M006: Финансы — Бюджеты, транзакции, отчеты
- [ ] M007: Аналитика — Дашборды, метрики, экспорт
- [ ] M008: Уведомления — Email, in-app, webhook