# Unified CRM Finance

Единая CRM-система, объединяющая управление закупками ([zakuppro](https://github.com/ybatkovsky-jpg/zakuppro)) и контроль финансов с элементами CRM ([finpro](https://github.com/ybatkovsky-jpg/finpro)) в один программный комплекс. Цель — дать компании единую точку входа для ведения клиентов, сделок, договоров, проектов, закупок и управленческого учёта.

**Статус:** M001–M008 завершены ✅ | Активная разработка продолжается

---

## Структура проекта

```
unified-crm-finance/
├── apps/
│   ├── web/                       # Next.js 16 фронтенд (React 19, Tailwind CSS v4, shadcn/ui)
│   │   └── src/
│   │       ├── app/               # App Router: CRM, Deals, Projects, Contracts, Procurement, Finance, Analytics
│   │       ├── components/        # UI-компоненты (shadcn/ui) + модульные виджеты
│   │       └── lib/               # API клиенты, репозитории, Prisma, email, webhooks
│   └── worker/                    # Python FastAPI воркер (consumer, health, Celery)
├── docs/                          # Спецификация (22 файла)
├── docker-compose.yml             # PostgreSQL 16 + RabbitMQ + MinIO
├── LICENSE                        # Проприетарная лицензия
└── README.md
```

## Быстрый старт

```bash
# Установка зависимостей
cd apps/web && npm install

# Применение миграций Prisma
npx prisma generate && npx prisma db push

# Запуск dev-сервера
npm run dev
# → http://localhost:3000 → дашборд
```

## Ключевые решения

| Решение | Выбор | Обоснование |
|---------|-------|-------------|
| Архитектура | Модульный монолит на Next.js + FastAPI | Единый стек, гибридный backend |
| Frontend | Next.js 16 + React 19 + TypeScript + shadcn/ui | Единый стек обоих исходных проектов |
| Backend | Next.js API Routes + Python FastAPI | Next.js для UI-логики; Python для фоновых задач |
| База данных | PostgreSQL 16 + Prisma 6 ORM | 42+ сущности, UUID PK, мягкое удаление |
| Очереди | RabbitMQ + Celery | Проверено в zakuppro |
| Аутентификация | NextAuth + JWT, RBAC | Уже реализовано в finpro |

## Статус разработки

| Milestone | Статус | Модули |
|-----------|--------|--------|
| **M001** — Инфраструктура и модель данных | ✅ Завершён | Monorepo, Docker, Prisma schema (42 модели), NextAuth, CI/CD |
| **M002** — CRM модуль | ✅ Завершён | Контакты, компании, взаимодействия, timeline |
| **M003/M009** — Сделки и контракты | ✅ Завершён | Pipeline (8 стадий), Kanban, drag-and-drop, конвертация в контракт |
| **M004** — Проекты | ✅ Завершён | Gantt, этапы, production, загрузка файлов |
| **M005** — Закупки | ✅ Завершён | Контрагенты, BOM, заявки, счета, сверка, согласование, склад, поставки |
| **M006** — Финансы | ✅ Завершён | Категории, бюджеты, транзакции, платежи, дашборд |
| **M007** — Аналитика | ✅ Завершён | Воронка продаж, P&L, команда, закупки, сводный дашборд |
| **M008** — Уведомления | ✅ Завершён | Email, in-app (колокольчик), webhooks |

## Что уже работает

### CRM & Продажи
- **Контакты** (`/crm/contacts`) — список, детальная страница, timeline взаимодействий
- **Сделки** (`/deals`) — Kanban-доска с drag-and-drop по 8 стадиям, конвертация в контракт
- **Контракты** (`/contracts`) — версионность (MAX+1), подписанты, шаблоны

### Проекты
- **Проекты** (`/projects`) — детали, этапы, Gantt-график, production-трекинг
- **Бюджеты** — виджет бюджета на странице проекта, группировка по периодам

### Закупки
- **Контрагенты** (`/procurement/counterparties`) — CRUD, типы, история
- **BOM** — загрузка Excel, редактируемая таблица, назначение поставщиков
- **Запросы** (`/procurement/purchase-requests`) — статус-машина, отправка поставщикам
- **Счета** (`/procurement/invoices`) — сверка, reconciliation, статус-машина
- **Согласования** (`/procurement/approvals`) — approve/reject, уведомления
- **Склад** (`/procurement/warehouse`) — остатки, транзакции (in/out/reserve/release)
- **Поставки** (`/procurement/deliveries`) — статус-трекинг, автообновление склада

### Финансы
- **Категории** (`/finance/categories`) — иерархия, доходы/расходы
- **Транзакции** (`/finance/transactions`) — доходы/расходы, фильтры, сводки
- **Платежи** (`/finance/payments`) — план/график/оплачено/отменено
- **Дашборд** (`/finance`) — баланс, доходы/расходы, бюджеты, предстоящие платежи

### Аналитика
- **Воронка продаж** (`/analytics/funnel`) — конверсия по стадиям, суммы
- **P&L / Маржа** (`/analytics/margin`) — прибыльность проектов, топ-5
- **Команда** (`/analytics/team`) — метрики менеджеров, сравнение
- **Закупки** (`/analytics/procurement`) — циклы, поставщики, тренды
- **Сводный дашборд** (`/analytics`) — KPI-карточки, мини-виджеты

### Инфраструктура
- **Уведомления** — in-app колокольчик в навбаре, mark-as-read, email-отправка
- **Webhooks** — подписки, диспатч событий, retry с backoff
- **API** — Repository pattern, typed API clients, 35+ эндпоинтов

## Технологический стек

| Слой | Технологии |
|------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript 6, Tailwind CSS v4, shadcn/ui (Radix) |
| **UI паттерны** | Loading/error/empty states, optimistic updates, drag-and-drop (@dnd-kit) |
| **API** | Next.js API Routes, typed fetch clients, ApiClientError |
| **База данных** | PostgreSQL 16 (prod), SQLite (dev), Prisma 6 ORM, Repository pattern |
| **Worker** | Python FastAPI, Celery, RabbitMQ (aio-pika), SQLAlchemy async |
| **Хранилище** | MinIO (S3-совместимое), @aws-sdk/client-s3 |
| **CI/CD** | GitHub Actions (lint, typecheck, test, build, deploy) |

## Спецификация

Полная спецификация в [`docs/`](docs/):
- [`00-executive-summary.md`](docs/00-executive-summary.md) — резюме для стейкхолдеров
- [`03-target-architecture.md`](docs/03-target-architecture.md) — целевая архитектура
- [`04-tech-stack.md`](docs/04-tech-stack.md) — стек технологий
- [`05-data-model.md`](docs/05-data-model.md) — модель данных (42 сущности)
- [`18-roadmap.md`](docs/18-roadmap.md) — дорожная карта

## Связанные репозитории

- **zakuppro** — система управления закупками (Python/FastAPI + Next.js): https://github.com/ybatkovsky-jpg/zakuppro
- **finpro** — финансовый контроль с элементами CRM (Next.js + Prisma): https://github.com/ybatkovsky-jpg/finpro
