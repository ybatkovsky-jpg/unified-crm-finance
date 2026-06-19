# Unified CRM Finance

Единая CRM-система, объединяющая управление закупками ([zakuppro](https://github.com/ybatkovsky-jpg/zakuppro)) и контроль финансов с элементами CRM ([finpro](https://github.com/ybatkovsky-jpg/finpro)) в один программный комплекс. Цель — дать компании единую точку входа для ведения клиентов, сделок, договоров, проектов, закупок и управленческого учёта.

> Этот репозиторий содержит **только спецификацию и roadmap**. Исходный код будет разрабатываться в отдельных ветках/модулях после согласования документа.

---

## Что внутри

```
unified-crm-finance/
├── README.md                       — этот файл
├── LICENSE                         — проприетарная лицензия
├── .gitignore
└── docs/                           — спецификация и roadmap
    ├── 00-executive-summary.md     — краткое резюме для стейкхолдеров
    ├── 01-introduction.md          — цели, границы, глоссарий
    ├── 02-current-systems.md       — анализ zakuppro и finpro
    ├── 03-target-architecture.md   — целевая архитектура
    ├── 04-tech-stack.md            — стек технологий и обоснование
    ├── 05-data-model.md            — модель данных, ключевые сущности
    ├── 06-module-crm.md            — модуль CRM и контакты
    ├── 07-module-deals.md          — модуль сделки и воронка
    ├── 08-module-contracts.md      — модуль договоры
    ├── 09-module-projects.md       — модуль проекты/объекты
    ├── 10-module-procurement.md    — модуль закупки
    ├── 11-module-finance.md        — модуль финансы / управленческий учёт
    ├── 12-module-analytics.md      — модуль аналитика и дашборды
    ├── 13-module-notifications.md  — модуль уведомления и согласования
    ├── 14-api-contracts.md         — API-контракты (REST + webhook)
    ├── 15-security-rbac.md         — безопасность, роли, аудит
    ├── 16-non-functional.md        — нефункциональные требования
    ├── 17-risks-mitigations.md     — риски и меры противодействия
    ├── 18-roadmap.md               — дорожная карта на 6 месяцев
    ├── 19-testing-strategy.md      — стратегия тестирования
    └── adr/                        — Architecture Decision Records
        ├── ADR-01-unified-data-model.md   — унификация моделей zakuppro + finpro
        └── ADR-02-hybrid-backend.md       — гибрид Next.js + Python FastAPI
```

---

## Ключевые решения (one-liner)

| Решение | Выбор | Обоснование |
|---------|-------|-------------|
| Архитектурный подход | Полный рефакторинг на едином стеке | Заказчик явно выбрал этот вариант в анкете требований |
| Frontend-стек | Next.js 16 + React 19 + TypeScript + shadcn/ui | Уже идентичен в обоих исходных проектах |
| Backend-стек | Гибрид: Next.js API Routes + Python FastAPI-воркеры | Next.js — для UI-связанной логики; Python — для AI, email, парсинга |
| База данных | PostgreSQL 16 + Prisma ORM | Один из исходных проектов уже на PostgreSQL/Prisma |
| Очереди | RabbitMQ + Celery | Используется в zakuppro, проверено в продакшене |
| Аутентификация | NextAuth + JWT, RBAC | Уже реализовано в finpro |
| Миграция данных | Старт с чистого листа | Решение заказчика; старые системы остаются в архивном режиме |
| Хоризонт roadmap | 6 месяцев (12 спринтов по 2 недели) | Соответствует решению заказчика |

---

## Как читать спецификацию

- **Стейкхолдерам и руководителям** — начните с [`docs/00-executive-summary.md`](docs/00-executive-summary.md) и [`docs/18-roadmap.md`](docs/18-roadmap.md).
- **Архитекторам и тимлидам** — `docs/01` → `docs/02` → `docs/03` → `docs/04` → `docs/05`.
- **Разработчикам модулей** — раздел `docs/06`–`docs/13` по своему модулю, затем `docs/14` (API) и `docs/15` (безопасность).
- **DevOps и SecOps** — `docs/04`, `docs/15`, `docs/16`, `docs/17`.

---

## Статус документа

| Версия | Дата | Автор | Что изменилось |
|--------|------|-------|----------------|
| 0.1.0 | 2026-06-19 | Spec Bot | Первый черновик спецификации и roadmap |
| 0.2.0 | 2026-06-19 | Spec Bot | Добавлены ADR-01, ADR-02, Mermaid-диаграммы в docs/03 и docs/05, раздел docs/19-testing-strategy |

Документ находится в статусе **Draft (v0.2.0)** и ожидает ревью заказчика. После согласования каждой части номер версии увеличивается по semver: правки мелких неточностей — patch, новые требования или разделы — minor, изменение архитектурных решений — major.

---

## Связанные репозитории

- **zakuppro** — система управления закупками (Python/FastAPI + Next.js): https://github.com/ybatkovsky-jpg/zakuppro
- **finpro** — финансовый контроль с элементами CRM (Next.js + Prisma): https://github.com/ybatkovsky-jpg/finpro
- **unified-crm-finance** (этот репозиторий) — спецификация и roadmap объединения.
