# Разработка — Quick Start

## Требования

- **Node.js** 22+
- **npm** 10+
- **Python** 3.12+
- **Docker** 24+ и Docker Compose v2
- (Опционально) **Bun** 1.3+ для запуска production-сборки

## Первый запуск (5 минут)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/ybatkovsky-jpg/unified-crm-finance.git
cd unified-crm-finance

# 2. Скопировать .env.example в .env и заполнить секреты
cp .env.example .env
# Отредактировать .env:
#   - NEXTAUTH_SECRET (сгенерировать: openssl rand -base64 32)
#   - INTERNAL_WEBHOOK_SECRET (сгенерировать: openssl rand -hex 32)
#   - LLM_API_KEY (опционально для S1)

# 3. Поднять окружение (PostgreSQL + RabbitMQ + MinIO + web + worker)
make docker-up

# 4. Применить миграции и заполнить БД тестовыми данными
make db-migrate
make db-seed

# 5. Открыть http://localhost:3000
# Логин: admin@local / admin123
```

## Разработка без Docker

Если хотите запускать Next.js и Python локально (для hot-reload):

```bash
# 1. Поднять только инфраструктуру
docker compose up -d db rabbitmq minio

# 2. Установить зависимости
make install

# 3. В одном терминале — Next.js
make dev

# 4. В другом терминале — Python worker
make worker-dev

# 5. В третьем терминале — Celery worker (опционально для S2+)
make worker-worker
```

## Полезные команды

| Команда | Описание |
|---------|----------|
| `make help` | Список всех команд |
| `make docker-up` | Поднять всё окружение |
| `make docker-down` | Остановить окружение |
| `make docker-logs` | Логи всех сервисов |
| `make dev` | Next.js в dev-режиме |
| `make worker-dev` | Python FastAPI в dev-режиме |
| `make lint` | ESLint |
| `make typecheck` | TypeScript проверка типов |
| `make test` | Все unit + integration тесты |
| `make db-migrate` | Применить миграции Prisma |
| `make db-seed` | Заполнить БД тестовыми данными |
| `make db-studio` | Prisma Studio (GUI для БД) на http://localhost:5555 |

## Структура монорепо

```
unified-crm-finance/
├── apps/
│   ├── web/                          # Next.js (TypeScript)
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages + API Routes
│   │   │   │   ├── api/
│   │   │   │   │   └── health/route.ts
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── lib/
│   │   │   │   ├── db.ts             # Prisma client
│   │   │   │   └── utils.ts          # Утилиты (cn, formatDate, ...)
│   │   │   └── middleware.ts         # Auth + RBAC (S2)
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Единая схема БД (см. ADR-01)
│   │   │   └── seed.ts               # Тестовые данные
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── components.json           # shadcn/ui config
│   │   └── Dockerfile
│   └── worker/                       # Python FastAPI + Celery
│       ├── app/
│       │   ├── __init__.py
│       │   ├── main.py               # FastAPI app + /internal/health
│       │   ├── celery_app.py         # Celery + расписание
│       │   ├── database.py           # SQLAlchemy (reflect)
│       │   └── tasks.py              # Celery-задачи (заглушки)
│       ├── requirements.txt
│       ├── pytest.ini
│       ├── conftest.py
│       └── Dockerfile
├── docker/
│   └── db/init/                      # SQL-инициализация PostgreSQL
│       └── 01-init-roles.sql         # Создание роли 'worker' (см. ADR-02)
├── .github/workflows/                # CI
│   ├── ci-web.yml                    # Lint + Typecheck + Build (Next.js)
│   ├── ci-worker.yml                 # Ruff + Mypy + Pytest (Python)
│   ├── ci-docker.yml                 # Validate docker-compose
│   └── codeql.yml                    # Security analysis
├── docs/                             # Спецификация (см. README.md)
├── docker-compose.yml                # Локальная разработка
├── .env.example                      # Шаблон переменных окружения
├── Makefile                          # Часто используемые команды
└── package.json                      # npm workspaces root
```

## Порты

| Сервис | Порт | URL / Доступ |
|--------|------|--------------|
| Next.js (web) | 3000 | http://localhost:3000 |
| Python worker API | 8000 | http://localhost:8000/docs (Swagger) |
| PostgreSQL | 5432 | `psql -h localhost -U unified -d unified_crm` (пароль: unified_password) |
| RabbitMQ AMQP | 5672 | — |
| RabbitMQ Management | 15672 | http://localhost:15672 (unified / unified_password) |
| MinIO S3 API | 9000 | — |
| MinIO Console | 9001 | http://localhost:9001 (unified_minio / unified_minio_secret) |

## CI/CD

4 workflow'а в `.github/workflows/`:

1. **ci-web.yml** — на каждый PR/merge в apps/web: lint, typecheck, build, Prisma validate.
2. **ci-worker.yml** — на каждый PR/merge в apps/worker: ruff, mypy, pytest.
3. **ci-docker.yml** — на каждый PR/merge в Docker-файлы: docker compose config validation.
4. **codeql.yml** — security-анализ (раз в неделю + на PR).

## Что реализовано в S1 (этот коммит)

- ✅ Структура монорепо (npm workspaces)
- ✅ Next.js 16 + TypeScript 5 + Tailwind 4 (конфиг)
- ✅ Prisma-схема (40+ моделей из docs/05-data-model.md)
- ✅ Python FastAPI + Celery + SQLAlchemy (reflect)
- ✅ Docker Compose с PostgreSQL, RabbitMQ, MinIO, web, worker, celery-worker, celery-beat
- ✅ Health endpoint: http://localhost:3000/api/health
- ✅ Seed: admin@local / admin123
- ✅ CI: lint, typecheck, build, Prisma validate, ruff, mypy, pytest, CodeQL

## Что НЕ реализовано (будущие спринты)

- ❌ S2: NextAuth (login/logout), RBAC middleware, AuditLog middleware, FileEntity upload
- ❌ S3: Модуль CRM (CRUD контактов, UI)
- ❌ S4: Модуль Сделки (Kanban)
- ❌ S5: Модуль Договоры (генерация PDF)
- ❌ S6: Модуль Проекты (Kanban + guardrails)
- ❌ S7-S8: Перенос AI-агента, email-воркера, склада из zakuppro
- ❌ S9-S10: Перенос финансового контура из finpro
- ❌ S11: Аналитика, Telegram-бот, уведомления
- ❌ S12: Production-запуск, обучение

См. полный roadmap: [`docs/18-roadmap.md`](docs/18-roadmap.md).

## Отладка

### Prisma миграции не применяются

```bash
# Сброс БД
make docker-down
docker volume rm unified-crm-finance_postgres_data
make docker-up
make db-migrate
make db-seed
```

### Python worker не подключается к БД

```bash
# Проверить health
curl http://localhost:8000/internal/health

# Логи
docker compose logs worker

# Проверить соединение из контейнера
docker compose exec worker python -c "from app.database import check_connection; print(check_connection())"
```

### RabbitMQ Management UI

http://localhost:15672 → вход `unified` / `unified_password`

### Просмотр логов Celery

```bash
docker compose logs -f celery-worker
docker compose logs -f celery-beat
```
