# M001: Инфраструктура и модель данных

**Gathered:** 2026-06-20
**Status:** Ready for planning

## Project Description

Объединённая CRM-система для управления закупками, финансами, сделками, проектами и контрактами. M001 создаёт инфраструктурный фундамент: монорепозиторий, Docker Compose окружение, Prisma схему данных, базовую аутентификацию и UI.

## Why This Milestone

Без инфраструктуры невозможно начинать разработку бизнес-модулей. M001 устанавливает:
- Единую среду разработки и деплоя
- Консистентную модель данных
- Базовую аутентификацию
- Фундамент UI для всех модулей

## User-Visible Outcome

### Когда M001 завершён, пользователь может:

- Запустить систему одной командой `docker compose up`
- Открыть браузер на http://localhost:3000 и увидеть страницу логина
- Ввести credentials и попасть в систему с базовым layout
- Увидеть работающий `/health` endpoint для web и worker

### Entry point / environment

- Entry point: http://localhost:3000 (web), http://localhost:8000/health (worker)
- Environment: local dev (Docker Compose)
- Live dependencies: PostgreSQL 16, RabbitMQ, MinIO

## Completion Class

- Contract complete means: Все артефакты созданы (монорепо, Dockerfiles, Prisma схема, CI/CD), тесты проходят
- Integration complete means: Docker Compose поднимает все сервисы, health checks отвечают 200
- Operational complete means: `docker compose up` работает стабильно, нет утечек ресурсов

## Final Integrated Acceptance

Для завершения M001 необходимо доказать:

- `docker compose up --build` поднимает все сервисы без ошибок
- `/api/health` на web и worker отвечает 200 с status UP
- Prisma миграции применены, `npx prisma studio` работает
- Login flow работает: /login → submit → редирект на /
- CI/CD проходит: GitHub Actions зелёный на main ветке

## Architectural Decisions

### Организация монорепозитория

**Decision:** Feature-sliced структура внутри apps/web

**Rationale:** Модули (CRM, сделки, финансы) пересекаются по данным — нужна гибкость между автономией и совместным использованием кода. Feature-sliced даёт ясные границы + возможность переиспользовать UI и утилиты.

**Alternatives Considered:**
- Route groups — сложно вынести модуль отдельно позже
- Отдельные пакеты — много boilerplate, сложнее передавать состояние

### Docker Compose стратегия

**Decision:** Всё в Docker с volume mounting для hot reload

**Rationale:** Environment parity (как в проде), HMR работает через volumes, одна команда запуска для всех окружений.

**Alternatives Considered:**
- Веб локально — разный environment, сложнее новичкам
- Без volumes — нет hot reload, медленная разработка

### Deploy стратегия

**Decision:** Coolify для autodeploy на VPS

**Rationale:** Автодеплой из Git, UI для мониторинга, SSL из коробки. Вы будете разрабатывать от 0 до продакшена — автодеплой сэкономит время.

**Alternatives Considered:**
- Docker Compose вручную — нужно настраивать SSL/proxy/обновления
- Kubernetes — избыточно для одного приложения

### Tech stack

**Decision:** Next.js 16 + React 19 + Python 3.12 + FastAPI + PostgreSQL 16 + Prisma 6 + RabbitMQ

**Rationale:** По спецификации docs/04-tech-stack.md. Промышленные стеки с хорошей экосистемой.

### Error handling

**Decision:** Прагматичный подход для M001 — критичные сценарии без over-engineering

**Rationale:** M001 — инфраструктурный milestone. Критично чтобы сервисы не крашились и ошибки были видны в логах. Продвинутое monitoring добавим позже.

**Alternatives Considered:**
- Глубокая обработка всех ошибок — избыточно для инфраструктуры
- Минимум логирования — сложно дебажить

## Error Handling Strategy

### Frontend (Next.js)
- try/catch на API вызовах, toast для ошибок
- ErrorBoundary для React crashes
- 401 → редирект на /login, другие ошибки → toast

### Backend (FastAPI Worker)
- Reconnect для RabbitMQ/DB с backoff
- Логирование ошибок в stdout
- /health endpoint отвечает 503 если критичные сервисы недоступны

### Infrastructure
- Docker restart policy: always
- Health checks для всех сервисов
- CI/CD — явные failure сообщения

## Risks and Unknowns

- **Консистентность Prisma + SQLAlchemy** — две ORM на одной БД должны быть консистентны. Устраняется в S02 когда Prisma схема зафиксирована.
- **Feature-sliced структура** — должна поддерживать модульную доработку. Устраняется в S01 когда структура создана.

## Existing Codebase / Prior Art

- `docs/` — спецификация системы (19 файлов)
- `zakuppro` репозиторий — Python/FastAPI + Next.js, паттерны для reference
- `finpro` репозиторий — Next.js + Prisma, модель данных для reference

## Relevant Requirements

- R001 — Монорепозиторий с npm workspaces
- R002 — Docker Compose для всех сервисов
- R003 — Prisma схема по спецификации
- R004 — NextAuth + JWT auth
- R005 — Базовый UI с shadcn/ui
- R006 — FastAPI worker + RabbitMQ
- R007 — CI/CD pipeline
- R008 — ADR-01 (гибридная архитектура)
- R009 — ADR-02 (модель данных)

## Scope

### In Scope

- Монорепозиторий с npm workspaces (apps/web, apps/worker, packages/*)
- Docker Compose (PostgreSQL, RabbitMQ, MinIO, web, worker)
- Prisma схема по docs/05-data-model.md
- NextAuth + JWT login flow
- Базовый UI (layout, sidebar, header, shadcn/ui)
- FastAPI worker с health endpoint
- GitHub Actions CI/CD
- ADR-01 и ADR-02

### Out of Scope / Non-Goals

- Миграция данных из zakuppro/finpro (данных нет)
- Бизнес-логика модулей (CRM, сделки, проекты, закупки, финансы)
- Продвинутые UI компоненты
- Monitoring/tracing (Sentry, OpenTelemetry)

## Technical Constraints

- Стек по спецификации: Next.js 16, React 19, Python 3.12, FastAPI, PostgreSQL 16, Prisma 6
- Feature-sliced структура для модульности
- Docker Compose для локалки и проды
- CI/CD через GitHub Actions
- Autodeploy через Coolify

## Integration Points

- **PostgreSQL** — общая БД для Next.js (Prisma) и Python (SQLAlchemy)
- **RabbitMQ** — очередь для воркера
- **MinIO** — S3-compatible storage для файлов
- **GitHub** — CI/CD и source of truth
- **Coolify** — autodeploy на VPS 64.188.56.25

## Testing Requirements

- Unit tests для auth utilities, Prisma helpers
- Integration tests для /api/health, /api/auth/*
- Lint (ESLint), typecheck (TypeScript strict)
- E2E для login flow (опционально для M001)

## Acceptance Criteria

### Per-slice

**S01 (Монорепо + Docker)**
- docker compose up поднимает db, rabbitmq, minio
- web и worker контейнеры билдятся без ошибок
- ADR-01 записан

**S02 (Prisma схема)**
- Prisma schema соответствует docs/05-data-model.md
- npx prisma migrate dev проходит
- npx prisma studio работает
- ADR-02 записан

**S03 (NextAuth)**
- /login page рендерится
- login flow работает (credentials → JWT → redirect)
- /api/auth/* endpoints отвечают

**S04 (Базовый UI)**
- Layout с sidebar/header рендерится
- shadcn/ui компоненты импортируются
- Тема переключается

**S05 (FastAPI worker)**
- /health отвечает 200
- RabbitMQ consumer подключён
- Логи видны в docker logs

**S06 (CI/CD)**
- GitHub Actions workflow существует
- lint, typecheck, test, build проходят
- Autodeploy через Coolify настроен

## Open Questions

Нет — всё обсуждено и подтверждено.