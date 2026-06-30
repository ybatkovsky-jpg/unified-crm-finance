# 04. Стек технологий

> ⚠️ **Архивный документ.** Описывает «целевой» стек из исходного ТЗ — часть библиотек (Zustand, @tanstack/react-query, Recharts, date-fns, react-hook-form) **фактически не используются**. Реальный стек — в корневом [README.md](../README.md) §«Технологический стек». Сохранено для истории.

## 4.1. Обоснование выбора

Стек выбран на основе анализа исходных систем (см. [docs/02](02-current-systems.md)) с учётом требования заказчика «полный рефакторинг с сохранением текущего стека». Ключевое наблюдение: **frontend-стек обоих проектов идентичен** (Next.js 16 + React 19 + TypeScript + shadcn/ui), что делает унификацию UI практически бесплатной. Backend-стеки разные (Python/FastAPI в zakuppro, Next.js API Routes в finpro), но комплементарные: каждый силён в своей области.

Решение — **гибридный backend**: Next.js API Routes как основной API для CRUD и UI-логики, Python FastAPI как «воркерный» контур для AI, email, парсинга. Это позволяет:

- Минимизировать переписывание (AI-агент zakuppro переносится почти как есть).
- Сохранить typed end-to-end (TypeScript на обоих концах Next.js).
- Использовать Python там, где его экосистема сильнее (LLM, Pandas, imapflow, langchain).

## 4.2. Полный стек

### 4.2.1. Frontend

| Компонент | Технология | Версия | Обоснование |
|-----------|------------|--------|-------------|
| Framework | Next.js (App Router) | 16.1 | SSR + ISR + API Routes в одном процессе; уже используется в обоих проектах |
| Runtime | React | 19 | Server Components, use(), useOptimistic — современные возможности |
| Language | TypeScript | 5 | Строгая типизация, общий с backend через Prisma |
| Styling | Tailwind CSS | 4 | Utility-first, уже используется |
| Components | shadcn/ui (Radix UI primitives) | latest | Готовые accessible-компоненты, кастомизируются под дизайн-систему |
| State | Zustand | 5 | Простой, без boilerplate; уже используется |
| Server state | @tanstack/react-query | 5 | Кеширование, optimistic updates, invalidation |
| Tables | @tanstack/react-table | 8 | Headless, для спецификаций и BOM |
| DnD | @dnd-kit | 6 | Kanban с guardrails, accessibility |
| Charts | Recharts | 2 | Декларативные графики,React-нативный |
| Forms | react-hook-form + zod | 7 / 4 | Производительные формы, общая валидация с backend |
| Date | date-fns | 4 | Tree-shakeable работа с датами |
| PDF | pdfkit | 0.18 | Генерация PDF-договоров на сервере |
| Excel | xlsx (SheetJS) | 0.18 | Экспорт отчётов в Excel |
| Markdown | @mdxeditor/editor | 3 | Редактирование шаблонов договоров и заметок |
| i18n | next-intl | 4 | Локализация (русский + английский в будущем) |
| Notifications UI | sonner | 2 | Toast-уведомления |

### 4.2.2. Backend (Next.js API)

| Компонент | Технология | Версия | Обоснование |
|-----------|------------|--------|-------------|
| Runtime | Node.js 22 LTS / Bun 1.3 | latest | Bun для production (быстрее), Node для dev-совместимости |
| Framework | Next.js API Routes | 16.1 | Единый процесс с frontend, простой деплой |
| ORM | Prisma | 6.11 | Типизированный доступ к БД, миграции, общий schema.prisma |
| Database | PostgreSQL | 16 | JSONB, RLS, full-text search, производительность |
| Validation | zod | 4 | Общие схемы с frontend |
| Auth | NextAuth | 4.24 | JWT-сессии, Credentials-провайдер, готовая интеграция |
| Password hashing | bcryptjs | 3 | Совместимость с существующими хешами из finpro |
| Rate limiting | custom in-memory + Redis (production) | — | Защита от brute-force |
| CSRF | custom (double-submit cookie) | — | Защита форм |
| Logging | pino (через обёртку) | latest | Structured logging, быстрый |
| Background tasks (light) | setImmediate + DB queue (для простых задач) | — | Без RabbitMQ для тривиальных операций |

### 4.2.3. Backend (Python Workers)

| Компонент | Технология | Версия | Обоснование |
|-----------|------------|--------|-------------|
| Language | Python | 3.12+ | Стабильная версия, поддержка match/case |
| Framework | FastAPI | 0.115 | Async, auto-docs, типизация через Pydantic |
| ORM | SQLAlchemy | 2.0.35 (async) | Зрелая, async-support, совместимость с существующим кодом zakuppro |
| Migrations | Alembic | 1.13 | Стандарт для SQLAlchemy |
| Validation | Pydantic | 2.9.2 | Интеграция с FastAPI |
| Task queue | Celery | 5.4 | Зрелая, с DLQ и retrial |
| Message broker | RabbitMQ | 3 | Используется в zakuppro, проверен в продакшене |
| Email send | aiosmtplib | 3.0 | Async SMTP |
| Email receive | imapflow | 1.3 | Async IMAP, проще stdlib imaplib |
| Excel | pandas + openpyxl + xlsxwriter | 2.2 / 3.1 / 3.2 | Стандарт для анализа табличных данных |
| PDF parsing | pdfplumber | 0.11 | Извлечение таблиц из PDF |
| LLM | OpenAI SDK + Anthropic SDK + Google GenAI + DeepSeek | latest | Multi-provider с fallback |
| LLM orchestration | LangChain + LangGraph | 0.3 / 0.2 | State machines для AI-агента, retry, structured output |
| Telegram | python-telegram-bot | 21.10 | Зрелая библиотека |
| HTTP client | httpx | 0.27 | Async, таймауты, retry |
| Fuzzy matching | rapidfuzz | 3.9 | Быстрый Levenshtein |
| Testing | pytest + pytest-asyncio | latest | Стандарт |

### 4.2.4. Infrastructure

| Компонент | Технология | Версия | Обоснование |
|-----------|------------|--------|-------------|
| Container runtime | Docker | 24+ | Стандарт |
| Orchestration (dev) | Docker Compose | latest | Простой, всё в одном файле |
| Reverse proxy | Caddy | 2 | Auto-HTTPS, простой конфиг |
| Object storage | MinIO (dev) / S3 (prod) | latest | S3-совместимый API |
| DB backups | pg_dump + S3 lifecycle | — | Ежедневные, retention 30 дней |
| Monitoring | Prometheus + Grafana (опционально) | latest | Метрики приложения и БД |
| Logs | JSON stdout → docker logs driver | — | Structured logging |
| Error tracking | Sentry (опционально) | — | Production error monitoring |
| CI/CD | GitHub Actions | — | Интеграция с GitHub |

## 4.3. Структура монорепозитория

```
unified-crm-finance/
├── apps/
│   ├── web/                          # Next.js приложение
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages + API Routes
│   │   │   │   ├── (auth)/           # Страницы логина
│   │   │   │   ├── (dashboard)/      # Основные модули
│   │   │   │   │   ├── crm/          # Модуль CRM
│   │   │   │   │   ├── deals/        # Модуль Сделки
│   │   │   │   │   ├── contracts/    # Модуль Договоры
│   │   │   │   │   ├── projects/     # Модуль Проекты
│   │   │   │   │   ├── procurement/  # Модуль Закупки
│   │   │   │   │   ├── finance/      # Модуль Финансы
│   │   │   │   │   ├── analytics/    # Модуль Аналитика
│   │   │   │   │   └── settings/     # Настройки
│   │   │   │   └── api/
│   │   │   │       └── v1/
│   │   │   ├── components/           # React-компоненты (ui/, business/)
│   │   │   ├── lib/
│   │   │   │   ├── services/         # Бизнес-логика по модулям
│   │   │   │   ├── auth/             # Аутентификация
│   │   │   │   ├── db.ts             # Prisma client
│   │   │   │   └── utils.ts
│   │   │   ├── hooks/
│   │   │   ├── store/                # Zustand stores
│   │   │   ├── types/
│   │   │   └── middleware.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── public/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   └── worker/                       # Python FastAPI + Celery
│       ├── app/
│       │   ├── main.py               # FastAPI app
│       │   ├── routers/              # Internal API эндпоинты
│       │   ├── tasks/                # Celery tasks
│       │   │   ├── ai_parse_bom.py
│       │   │   ├── ai_verify_invoice.py
│       │   │   ├── email_send.py
│       │   │   ├── email_poll.py
│       │   │   ├── bank_import.py
│       │   │   └── notification_send.py
│       │   ├── services/             # Бизнес-логика воркера
│       │   ├── models.py             # SQLAlchemy модели (read-only views на ту же БД)
│       │   ├── schemas.py            # Pydantic
│       │   ├── llm_provider.py       # Multi-LLM wrapper
│       │   ├── email_worker.py
│       │   ├── telegram_bot.py
│       │   └── celery_app.py
│       ├── alembic/                  # Миграции (только для вьюх/функций, не таблиц)
│       ├── tests/
│       ├── requirements.txt
│       └── Dockerfile
├── packages/                         # (будущее) общие пакеты
│   └── types/                        # Общие TypeScript типы
├── docker-compose.yml                # Локальная разработка
├── docker-compose.prod.yml           # Production
├── .env.example
├── Makefile                          # Часто используемые команды
├── package.json                      # Workspace root
└── docs/                             # Эта спецификация
```

## 4.4. Управление зависимостями

- **Node.js** — npm workspaces (или pnpm/bun workspaces). Каждый `apps/*` имеет свой `package.json`, общие зависимости через root.
- **Python** — `requirements.txt` с pin-ами версий (как в zakuppro). В будущем — переход на `pyproject.toml` + `uv` для скорости.
- **База данных** — единая Prisma-схема в `apps/web/prisma/schema.prisma`. Python-сторона подключается к той же БД через SQLAlchemy с `reflect=True` для views, либо с явными моделями только для чтения.

## 4.5. Соглашения по коду

### 4.5.1. TypeScript

- `strict: true` в `tsconfig.json`.
- ESLint с `eslint-config-next` + кастомные правила (no `any` без eslint-disable).
- Имена файлов: `kebab-case.ts` для утилит, `PascalCase.tsx` для компонентов.
- Имена переменных/функций: `camelCase`.
- Имена типов/интерфейсов: `PascalCase`.
- Имена констант: `SCREAMING_SNAKE_CASE`.
- Имена таблиц БД: `PascalCase` (Prisma model) → `snake_case` (DB table).

### 4.5.2. Python

- PEP 8, type hints обязательны.
- Black + isort + ruff для форматирования.
- Имена файлов: `snake_case.py`.
- Имена классов: `PascalCase`.
- Имена функций/переменных: `snake_case`.

### 4.5.3. API

- REST-эндпоинты: kebab-case в путях (`/api/v1/deal-stages`).
- JSON-поля: camelCase (соответствует TS-конвенции, автоматически маппится Prisma).
- HTTP-коды: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Unprocessable Entity), 429 (Too Many Requests), 500 (Internal Server Error).
- Все ошибки — в едином формате: `{ error: { code: string, message: string, details?: object } }`.

### 4.5.4. Git

- Ветвление: trunk-based (`main` + feature branches).
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- PR: обязательный review + CI green.
- Перед merge — squash-and-merge с понятным сообщением.

## 4.6. Версионирование

- Приложение: SemVer (MAJOR.MINOR.PATCH), версия в `package.json`.
- API: URL-versioning (`/api/v1/`), breaking changes — новая версия.
- DB schema: Prisma migrations + Alembic revisions (для Python-стороны), версонируются в Git.
- Документация: SemVer, версия в README.md.
