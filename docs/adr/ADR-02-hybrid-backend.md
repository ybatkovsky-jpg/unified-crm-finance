# ADR-02: Гибридный backend — Next.js API Routes + Python FastAPI worker

- **Статус:** Proposed (ожидает ревью заказчика)
- **Дата:** 2026-06-19
- **Автор:** Spec Bot
- **Решает:** спринт 1, эпик S1-11

## Контекст

У нас два исходных проекта с разными backend-стеками:

- **zakuppro** — Python/FastAPI + SQLAlchemy + Celery + RabbitMQ. Сильная сторона: AI-агент (LangChain/LangGraph, multi-LLM), email-воркер (IMAP/SMTP), Telegram-бот, парсинг Excel/PDF через pandas/pdfplumber. Слабая сторона: нет единого UI-фреймворка (фронтенд отдельно на Next.js).
- **finpro** — Next.js + Prisma. Сильная сторона: типизированный fullstack (TypeScript end-to-end), простая инфраструктура (один процесс), NextAuth, shadcn/ui. Слабая сторона: нет AI/(email/Telegram) — только in-app уведомления.

Если выбрать только один стек, мы потеряем либо AI-агента (если только Next.js), либо типизацию end-to-end и удобство UI (если только Python).

## Решение

**Гибридный backend:** Next.js API Routes как основной API + Python FastAPI как «воркерный» контур для AI/email/Telegram/парсинга. Оба процесса работают с одной PostgreSQL-БД.

### Разделение ответственности

| Что | Где | Почему |
|-----|-----|--------|
| UI (React pages) | Next.js | SSR/ISR, единый процесс с API |
| CRUD-эндпоинты | Next.js API Routes | Типизация end-to-end, простота |
| Аутентификация | Next.js (NextAuth + JWT) | Единая с UI |
| RBAC | Next.js middleware | На уровне HTTP-запроса |
| Audit log | Next.js (Prisma middleware) | На уровне мутации БД |
| Уведомления (in-app) | Next.js | Запись в `Notification`, WebSocket/polling |
| AI-задачи (парсинг BOM, сверка счетов) | Python (Celery) | LangChain/LangGraph, multi-LLM с fallback |
| Email (IMAP/SMTP) | Python (Celery) | imapflow, aiosmtplib |
| Telegram-бот | Python (long polling) | python-telegram-bot |
| Импорт 1С-клиент-банк | Python (Celery beat) | парсинг XML через pandas |
| Отправка уведомлений (email/Telegram) | Python (Celery) | централизованная отправка с retry |
| Дашборды/аналитика | Next.js | SQL через Prisma, материализованные представления |

### Взаимодействие между процессами

```
Next.js → Python (webhook для запуска задач):
  POST /internal/ai/parse-bom { fileId, projectId }
  POST /internal/ai/verify-invoice { invoiceId }
  POST /internal/notify { notificationId }
  Заголовок: X-Internal-Secret: <env var>

Python → Next.js (webhook для уведомлений о завершении):
  POST /api/internal/notifications { userId, type, ... }
  POST /api/internal/bom-parsed { bomId, itemsCount }
  Заголовок: X-Internal-Secret: <env var>

Оба → PostgreSQL (через各自的 ORM):
  Next.js: Prisma (read/write, источник правды для схемы)
  Python: SQLAlchemy (read/write, reflect или явные модели)
```

### Очередь задач

RabbitMQ + Celery — для асинхронных задач Python-воркера. Next.js не пишет в очередь напрямую, только через webhook на Python (который уже кладёт задачу в Celery).

Очереди:
- `ai_parse_bom` — парсинг Excel-спецификаций.
- `ai_verify_invoice` — сверка счетов.
- `email_send` — отправка email.
- `email_poll` — опрос IMAP (каждые 15 мин).
- `bank_import` — импорт 1С-выписки (ежедневно в 6:00).
- `notification_send` — отправка email/Telegram-уведомлений.

DLQ для каждой очереди, TTL 7 дней, админка для перезапуска.

### Аутентификация между процессами

- Webhook'и между Next.js и Python — через заголовок `X-Internal-Secret` (env var, общий для обоих).
- Доступ извне к Python-воркеру (`/internal/*`) — только через reverse proxy (Caddy) с ограничением по IP (только localhost или docker-сеть).
- Пользовательские запросы идут только на Next.js (`/api/v1/*`).

### Изоляция в БД

Два PostgreSQL-пользователя:
- `web_user` — для Next.js, полный CRUD.
- `worker_user` — для Python, ограниченные права: только на нужные таблицы (`invoices`, `bom_items`, `audit_logs`, `sync_logs`, `llm_logs`, `email_logs`).

Это уменьшает риск случайной порчи данных Python-воркером.

## Альтернативы, рассмотренные и отвергнутые

### Альтернатива A: Только Next.js (всё на TypeScript)

AI-агента переписать на TypeScript (через Vercel AI SDK или LangChain.js).

**Почему нет:**
- Multi-LLM-обёртка zakuppro отлажена на 5 провайдерах (DeepSeek, OpenAI, Anthropic, Gemini, Qwen) с fallback — переписывание = потеря 2–3 спринтов.
- `imapflow` нет в TS-экосистеме (придётся использовать сырой `imap` или писать обёртку).
- `pandas` для грязных Excel — нет аналога в TS.
- `python-telegram-bot` зрелее, чем TS-альтернативы.

### Альтернатива B: Только Python (всё на FastAPI)

Фронтенд — отдельное SPA (React) или Next.js только как фронтенд (без API Routes).

**Почему нет:**
- Теряем типизацию end-to-end (tRPC или ручные типы).
- Удвоение кода (контроллеры в FastAPI + типы в React).
- NextAuth удобнее для RBAC, чем самописная JWT в Python.
- Команда больше знакома с TypeScript.

### Альтернатива C: Микросервисы (5+ сервисов)

Каждый модуль — отдельный сервис со своей БД.

**Почему нет:**
- Размер команды не тянет.
- Транзакционная консистентность критична (см. ADR-01).
- DevOps-накладные расходы.

### Альтернатива D: Next.js + Python, но Python только как Celery-воркер без HTTP

Только RabbitMQ для коммуникации, без webhook'ов.

**Почему нет:**
- Next.js не должен писать в RabbitMQ напрямую (нужен отдельный publisher-сервис).
- Сложнее отлаживать (нет HTTP-эндпоинта для ручного запуска задачи).
- Health check Python-воркера удобнее через HTTP.

## Последствия

### Положительные

- Минимум переписывания (AI/email/Telegram переносятся как есть).
- Сохраняется типизация end-to-end на стороне Next.js.
- Каждый стек силён в своей области.
- Можно вынести Python-воркер в отдельный сервис при росте нагрузки.

### Отрицательные

- Два процесса — сложнее деплой (нужно следить, что оба запущены).
- Два ORM (Prisma + SQLAlchemy) — нужно держать схемы синхронизированными (решено в ADR-01).
- Корреляция логов — нужен `correlationId` через оба сервиса (через HTTP-заголовок `X-Request-Id`).
- Сложнее отладка — нужно знать, в каком процессе проблема.

### Митигации

- Docker Compose поднимает оба процесса одной командой.
- Health endpoints у обоих (`/api/health` и `/internal/health`) с проверкой БД и зависимостей.
- Структурированные логи (JSON) с `correlationId` — единая панель в ELK или аналог.
- Метрики Prometheus у обоих процессов.

## План реализации

1. **S1 (недели 1–2):** базовая структура `apps/web` (Next.js) и `apps/worker` (FastAPI + Celery), Docker Compose поднимает оба + PostgreSQL + RabbitMQ + MinIO.
2. **S2 (недели 3–4):** Python-воркер отвечает на `/internal/health`, подключается к БД, может записать тестовую строку в `audit_logs`. Next.js может её прочитать.
3. **S7 (недели 13–14):** перенос AI-задачи `parse-bom` из zakuppro, webhook от Next.js к Python.
4. **S8 (недели 15–16):** перенос IMAP-воркера, AI-сверки счетов.
5. **S11 (недели 21–22):** перенос Telegram-бота и email-уведомлений.

## Ссылки

- [docs/03-target-architecture.md](../03-target-architecture.md) — целевая архитектура
- [docs/04-tech-stack.md](../04-tech-stack.md) — полный стек
- [docs/14-api-contracts.md](../14-api-contracts.md) — внутренние webhook'и (раздел 14.11)
- [docs/17-risks-mitigations.md](../17-risks-mitigations.md) — риски R-02, R-12
- [ADR-01](./ADR-01-unified-data-model.md) — унификация моделей данных
