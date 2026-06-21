# Unified CRM Finance

Единая CRM-система, объединяющая управление закупками ([zakuppro](https://github.com/ybatkovsky-jpg/zakuppro)) и контроль финансов с элементами CRM ([finpro](https://github.com/ybatkovsky-jpg/finpro)) в один программный комплекс. Цель — дать компании единую точку входа для ведения клиентов, сделок, договоров, проектов, закупок и управленческого учёта.

**Статус:** M002 (CRM модуль) в активной разработке.

---

## Структура проекта

```
unified-crm-finance/
├── apps/
│   ├── web/                       # Next.js 16 фронтенд (React 19, Tailwind CSS v4, shadcn/ui)
│   │   └── src/
│   │       ├── app/               # App Router: layout, home, /crm/contacts
│   │       ├── components/ui/     # UI-компоненты (Table, Select, Button, Badge, Card, Input)
│   │       └── lib/               # API клиент, Prisma, утилиты
│   └── worker/                    # Python FastAPI воркер (consumer, health, DB)
├── docs/                          # Спецификация (19 файлов)
├── docker-compose.yml             # PostgreSQL 16 (dev)
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
# → http://localhost:3000 → редирект на /crm/contacts
```

## Ключевые решения

| Решение | Выбор | Обоснование |
|---------|-------|-------------|
| Архитектура | Полный рефакторинг на едином стеке | Выбор заказчика |
| Frontend | Next.js 16 + React 19 + TypeScript + shadcn/ui | Единый стек обоих исходных проектов |
| Backend | Next.js API Routes + Python FastAPI | Next.js для UI-логики; Python для AI/email/парсинга |
| База данных | PostgreSQL 16 + Prisma 6 ORM | Один из исходных проектов уже на PostgreSQL/Prisma |
| Очереди | RabbitMQ + Celery | Проверено в zakuppro |
| Аутентификация | NextAuth + JWT, RBAC | Уже реализовано в finpro |
| Миграция данных | Старт с чистого листа | Решение заказчика; старые системы в архив |

## Статус разработки

| Milestone | Статус |
|-----------|--------|
| M001 — Инфраструктура и модель данных | В процессе |
| M002 — CRM модуль (контакты, компании) | В процессе |
| M003–M008 — Сделки, проекты, закупки, финансы, аналитика, уведомления | Запланировано |

## Спецификация

Полная спецификация в [`docs/`](docs/):
- [`00-executive-summary.md`](docs/00-executive-summary.md) — резюме для стейкхолдеров
- [`03-target-architecture.md`](docs/03-target-architecture.md) — целевая архитектура
- [`04-tech-stack.md`](docs/04-tech-stack.md) — стек технологий
- [`05-data-model.md`](docs/05-data-model.md) — модель данных
- [`18-roadmap.md`](docs/18-roadmap.md) — дорожная карта

## Связанные репозитории

- **zakuppro** — система управления закупками (Python/FastAPI + Next.js): https://github.com/ybatkovsky-jpg/zakuppro
- **finpro** — финансовый контроль с элементами CRM (Next.js + Prisma): https://github.com/ybatkovsky-jpg/finpro
