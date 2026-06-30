# HANDOFF — контекст для продолжения

> Прочти этот файл + `.gsd/integration/PRODUCT-SPEC.md`. Здесь — всё, чтобы продолжить разработку ERP «ПРО Мебель» с того же места.
> Дата: 2026-06-30. Репо: `D:\CLAUDE\Project\unified-crm-finance` (git, ветка `feat/phase10-platform`).
> Последние коммиты: `30addfb` (Phase 10 — задачи/уведомления/аналитика, PLAT-01..05), `d2269fe` (Фазы 5–9). PLAT-06 (Орг-платформа задач) реализован, но **ещё не закоммичен** (в рабочем дереве).

---

## 1. Что за проект

ERP для ООО «ПРО Мебель» (производство + монтаж мебели на заказ, B2B+B2C). Объединение трёх систем (unified-crm-finance + zakuppro + finpro) в одно приложение.

**Стек:** Next.js 16 (Turbopack) + React 19 + Prisma 6.6.0 + PostgreSQL 16. Tailwind + shadcn/ui + Radix + dnd-kit. bcryptjs (пароли), jose (JWT). TypeScript (строгий).

**Каноническая спека:** [`.gsd/integration/PRODUCT-SPEC.md`](PRODUCT-SPEC.md) — полное ТЗ из интервью (8 модулей, жизненный цикл проекта, финансы, роли, UI-раскладка). **Приоритет над `docs/`** (там 20 техдоков с протухшими заявками «всё готово» — не верь).

**Роли (7):** director, manager_designer, technologist, supply, installer, accountant, storekeeper. Пользователь может иметь **несколько ролей** (права = union). Матрица — `src/lib/auth/roles.ts`.

---

## 2. Дорожная карта и статус

**MILESTONE v1.0 COMPLETE** — все 10 фаз + PLAT-06, 52/52 требований validated.

| # | Фаза | Статус |
|---|------|--------|
| 1 | Доступ и авторизация (RBAC) | ✅ 2026-06-28 |
| 2 | Стабилизация ядра | ✅ 2026-06-28 |
| 3 | Редизайн UI | ✅ 2026-06-28 |
| 4 | CRM — сделки и КП | ✅ 2026-06-29 |
| 5 | Проект — спецификация и закупки | ✅ 2026-06-29 |
| 6 | Производство, логистика, монтаж | ✅ 2026-06-29 |
| 7 | Акт, закрытие проекта, гарантия | ✅ 2026-06-29 |
| 8 | Финансы (банк-выписка, маржа, долги) | ✅ 2026-06-29 |
| 9 | Управленческий учёт (P&L, план/факт, ДДС) | ✅ 2026-06-29 |
| 10 | Задачи, уведомления, аналитика | ✅ 2026-06-30 |
| — | **PLAT-06: Орг-платформа задач** (post-milestone) | ✅ 2026-06-30 |

### Что сделано в последних сессиях (Фазы 6–10 + PLAT-06)

**Фаза 6 — Производство, логистика, монтаж:** аутсорс-производство с навыками (ДСП/камень/стекло), режим материала, доставка как расход, прогрессивный многозаходный монтаж, доп. работы.

**Фаза 7 — Акт, закрытие, гарантия:** подписание акта (физлица — монтажник, юрлица — менеджер), условия закрытия (акт/деньги/счета/бонус), срок гарантии 2 года.

**Фаза 8 — Финансы:** ProjectPayment (70/30), импорт банк-выписки 1С/TXT, наличные, маржа проекта с lowMargin-алертами, долги (дебиторка/кредиторка), выплата бонуса дизайнеру.

**Фаза 9 — Управленческий учёт:** 12 статей расходов, P&L (с прикидкой УСН 15%), план/факт, ДДС. Раздел «Учёт» (`/accounting`).

**Фаза 10 — Задачи, уведомления, аналитика:**
- PLAT-01: задачи-выезды с lineage (`originalTaskId`/`parentTaskId`/`failedReason`), перенос/пересоздание (`lib/db/tasks.ts`), раздел «Задачи» + 3 страницы.
- PLAT-02: in-app уведомления (колокол, `lib/notifications/events.ts` с dedupeKey, trigger-points в moveStage/оплатах/просрочке).
- PLAT-03/04/05: аналитика воронки (причины отказов), маржи (open/closed сплит), команды (win-rate + нагрузка).

**PLAT-06 — Орг-платформа задач (post-milestone):** общая платформа задач компании (реклама, налоги, аренда) — не связанных со сделками. Иерархия Department→OrgFunction→FunctionAssignment (head/responsible, один человек→несколько функций), TaskTemplate с RFC-5545 RRULE-повторением (`rrule` lib), ленивая материализация инстансов по наступлению срока (идемпотентно по templateId+plannedDate). Раздел `/org` (доска/шаблоны/структура) + инстансы в общем `/tasks`. RBAC-секция `org` добавлена всем ролям.

### ⚠️ Ревью Phase 10 — известные проблемы (требуют починки)
- 🔴 **IDOR уведомлений/задач:** `api/notifications/*` и `api/tasks/*` не проверяют сессию/владельца — любой залогиненный читает/меняет чужие данные.
- 🔴 **dedupeKey не работает:** `events.ts:36-49` findFirst без фильтра по metadata → дубли `task_overdue` при каждом чтении.
- 🔴 **RBAC-дыра аналитики:** `api/analytics/*` не фильтруют по `viewAllProjects` — менеджеры видят чужие финансы.
- 🟠 Семантический баг `stockValue` (кол-во единиц как ₽), N+1 в team-performance/budget-vs-actual, нет тестов для Phase 10 модулей.

---

## 3. Как запустить окружение (ВАЖНО — Docker сломан!)

Docker Desktop на машине отдаёт HTTP 500 (WSL без дистрибутивов, без админа не чинится). Поэтому **PostgreSQL поднят нативно из бинарников**.

**PostgreSQL 16.4 (нативно):**
- Бинарники: `D:\CLAUDE\tools\pgsql\bin\` · дата-каталог: `D:\CLAUDE\tools\pgdata` · лог: `D:\CLAUDE\tools\pg.log`
- trust-auth, слушает `localhost:5432`, БД `unified_crm`.
- **Старт:** `D:\CLAUDE\tools\pgsql\bin\pg_ctl.exe -D D:/CLAUDE/tools/pgdata -l D:/CLAUDE/tools/pg.log -W start` (флаг `-W` no-wait **ОБЯЗАТЕЛЕН** — без него `pg_ctl` зависает на Windows; не пайпить через `| tail`).
- **Стоп:** та же команда с `stop`.
- **psql:** `D:\CLAUDE\tools\pgsql\bin\psql.exe -h localhost -U postgres -d unified_crm -c "..."`

**Dev-сервер:** в `apps/web/package.json` **нет секции scripts** → запуск только через `npx`:
```bash
cd apps/web && npx next dev -p 3000
```
Dev-режим (Turbopack) **терпит** ошибки типов — страницы рендерятся. `next build` делает type-check.

**`.env` (apps/web):** `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/unified_crm"` + `AUTH_SECRET="pro-mebel-dev-..."` (jwt.ts имеет dev-fallback, если секрета нет).

**Логин для тестов:** `admin@local` / `admin123` (роль `director`). Создаётся сидом.

**Миграция/сид:**
```bash
cd apps/web
npx prisma migrate dev --name <имя>   # если менял schema.prisma
npx tsx prisma/seed.ts                 # пересеять (идемпотентный через upsert)
```
Актуальные миграции: `init_postgres`, `crm_deal_sources`, `crm_deal_project_relation`, `crm_invoice_pr_link`.

---

## 4. Текущая схема БД (ключевые модели, 68 всего)

**CRM:** Deal (sourceId, lossReason, projectId, contractId, stageId), DealStage (isWonStage, isLostStage), DealHistory, Pipeline, LeadSource, Contact, Contract, ContractVersion, ContractSigner, CommercialOffer (версионирование)

**Проекты:** Project (status, dealId, marginTarget), ProjectStage (7: measurement_2→closure), ProjectStatusHistory, ProjectMember, Production (навыки), ProductionStage, Installation (многозаходный монтаж), InstallationWorker, AcceptanceAct, ChangeOrder (доп. работы)

**Спецификация/Закупки:** BOM (1:1 Project, locked/draft), BOMItem, PurchaseRequest (воронка), PurchaseRequestItem, Invoice (purchaseRequestId FK), InvoiceItem (isMatch), Counterparty, WarehouseItem, WarehouseTransaction, Delivery (логистика)

**Финансы:** Transaction, CashFlowPayment, ProjectPayment (70/30), Category, Budget (projectId nullable — орг-бюджеты), BankStatement, BankTransaction, DesignerBonus, ApprovalRequest

**Управленческий учёт:** (на базе Budget+Transaction) — 12 статей расходов, P&L, план/факт, ДДС считаются на лету.

**Платформа:** User, Role, UserRole, AuditLog, Notification, Task, Event, FileEntity

**PLAT-06 Орг-платформа (post-milestone):** Department, OrgFunction, FunctionAssignment (head/responsible), TaskTemplate (RRULE), + расширение Task (templateId, plannedDate, orgFunctionId).

**Всего моделей:** 68 (было 62 на Фазе 5; +6 в фазах 6–10, +4 в PLAT-06).

---

## 5. Глобальное состояние модулей (актуализация 2026-06-30)

| Модуль | Готовность | Примечание |
|--------|-----------|------------|
| 🔐 **RBAC** | 100% | 7 ролей, middleware-изоляция. ⚠️ Аналитика не фильтрует по viewAllProjects (ревью) |
| 🎨 **UI/UX** | 95% | Левый сайдбар + поднав, motion, мобильный вид. Глобальный поиск отсутствует |
| 📊 **CRM** | 100% | Источники, канбан, КП с версионированием, замеры, отказы, бонус дизайнера |
| 📁 **Проекты** | 100% | Спецификация, закупки, производство, монтаж, акт, закрытие, гарантия |
| 🛒 **Закупки** | 100% | Email-запрос log-only (SMTP отложен), автосверка, склад |
| 📦 **Склад** | 100% | Интегрирован с закупками |
| 💰 **Финансы** | 100% | Платежи 70/30, банк-выписка, маржа, долги, бонус |
| 📈 **Учёт** | 100% | 12 статей, P&L, план/факт, ДДС (`/accounting`) |
| 📋 **Задачи** | 100% | Lineage, перенос/пересоздание, раздел «Задачи» |
| 🔔 **Уведомления** | 90% | In-app. ⚠️ dedupeKey-дубли (ревью). Telegram/email → Future |
| 🏢 **Орг-платформа (PLAT-06)** | 100% | Отделы→функции→RRULE-задачи, ленивая материализация |

---

## 6. Как вести разработку

1. Создай `.planning/phases/0N-<slug>/0N-CONTEXT.md` и `0N-PLAN.md` (как в `01-rbac/`, `04-crm/`).
2. Реализуй, проверь (`tsc --noEmit` + smoke через curl с cookie), закоммить.
3. Напиши `0N-VERIFICATION.md` + `0N-SUMMARY.md`.
4. Обнови `.planning/STATE.md` (progress, milestone registry).

**Коммиты — Conventional Commits** (`feat:`, `fix:`, `docs:`), трейлер `Co-Authored-By: Claude <noreply@anthropic.com>`. Репо коммитит **в `main`** напрямую.

---

## 7. Что делать дальше

**Приоритет 1 — закрыть критические находки ревью Phase 10 (безопасность/целостность):**
1. **IDOR уведомлений** (`api/notifications/*`): `getSession()` → использовать `session.id` вместо userId из query/body.
2. **IDOR задач** (`api/tasks/*`): добавить проверку сессии/владельца (образец — `api/org/tasks` с RBAC).
3. **dedupeKey** (`events.ts:36-49`): добавить фильтр по `metadata.dedupeKey` в `findFirst` (или колонку `dedupeKey` + индекс).
4. **RBAC аналитики** (`api/analytics/*`): для не-`viewAllProjects` фильтровать по `managerId: session.id`.
5. **Семантический баг** `stockValue` (кол-во единиц как ₽) в procurement-metrics.

**Приоритет 2 — Future requirements:** Telegram-бот + email для уведомлений (PLAT-02 расширение), гарантийные заявки, прайсы поставщиков, телефония, инвентаризация, контроль качества.

**Приоритет 3 — технический долг:** N+1 в team-performance/budget-vs-actual, тесты для Phase 10 модулей (tasks/notifications/analytics), Bug: Task.createdBy='system'.

**Заметка:** PLAT-06 (Орг-платформа задач) реализован, но **не закоммичен** — закоммитить отдельно или вместе с починкой ревью-findings.

---

## 8. Грабли и нюансы

- **CWD сбрасывается** в Bash-инструменте между вызовами — используй абсолютные пути или `cd` в каждом вызове. Код приложения — в `apps/web/`.
- **`apps/web/nul`** — Windows-reserved файл ломал Turbopack («Неверная функция os error 1»). Удалён через `\\?\`-префикс. Если снова появится — удали так же.
- **Убить процесс на порту:** `cmd //c "netstat -ano | findstr :3000 | findstr LISTENING"` → PID, затем `cmd //c "taskkill /PID <pid> /F"`. Обычный `taskkill` через Git Bash не работает (интерпретирует `/PID` как путь).
- **Prisma generate на Windows:** если запущен dev-сервер (node.exe держит `query_engine-windows.dll`), генерация падает с EPERM. Надо убить dev-сервер перед `prisma migrate dev` / `prisma generate`.
- **Decimal**: деньги в БД = `Decimal(15,2)`; `decimal-extension.ts` нормализует `Prisma.Decimal → number` в обоих синглтонах (`db`, `prisma`).
- **`prisma.$transaction`** с extended client (decimal extension) создаёт несовместимость типов для tx-коллбэка. Решение: `tx: any` в параметрах функций, вызываемых внутри транзакции.
- **seed.ts** комментарий в шапке устарел (говорит «5 ролей», реально 7).
- **Старые SQLite-миграции** висят как ` D` (deleted) в git status — это baseline-сброс для Postgres, не коммитить.
- **Формат ПМ:** `ПМ{YYYY}-{NNNN}` (4 цифры, последовательный), генерируется через `lib/db/sequence.ts`. Проект и договор получают один номер.

---

## 9. Память (для будущих сессий Claude)

Лежит в `C:\Users\Yura\.claude\projects\d--CLAUDE-Project-unified-crm-finance\memory\`:
- `product-spec-canon.md` — каноническая спека
- `local-pg-run-setup.md` — нативный PG + запуск dev
- `step2-unified-schema-progress.md` — Шаг 2 завершён
- `docker-postgres-blocker.md` — Docker болен
