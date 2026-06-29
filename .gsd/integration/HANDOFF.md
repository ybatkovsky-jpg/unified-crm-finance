# HANDOFF — контекст для продолжения

> Прочти этот файл + `.gsd/integration/PRODUCT-SPEC.md`. Здесь — всё, чтобы продолжить разработку ERP «ПРО Мебель» с того же места.
> Дата: 2026-06-29. Репо: `D:\CLAUDE\Project\unified-crm-finance` (git, ветка `main`).
> Последние коммиты: `7b8f206` (Фаза 4 CRM-ядро), `269c6d7` (Фаза 5 аудит-фиксы).

---

## 1. Что за проект

ERP для ООО «ПРО Мебель» (производство + монтаж мебели на заказ, B2B+B2C). Объединение трёх систем (unified-crm-finance + zakuppro + finpro) в одно приложение.

**Стек:** Next.js 16 (Turbopack) + React 19 + Prisma 6.6.0 + PostgreSQL 16. Tailwind + shadcn/ui + Radix + dnd-kit. bcryptjs (пароли), jose (JWT). TypeScript (строгий).

**Каноническая спека:** [`.gsd/integration/PRODUCT-SPEC.md`](PRODUCT-SPEC.md) — полное ТЗ из интервью (8 модулей, жизненный цикл проекта, финансы, роли, UI-раскладка). **Приоритет над `docs/`** (там 20 техдоков с протухшими заявками «всё готово» — не верь).

**Роли (7):** director, manager_designer, technologist, supply, installer, accountant, storekeeper. Пользователь может иметь **несколько ролей** (права = union). Матрица — `src/lib/auth/roles.ts`.

---

## 2. Дорожная карта и статус

| # | Фаза | Статус | Коммит |
|---|------|--------|--------|
| 1 | Доступ и авторизация (RBAC) | ✅ | `166e34c`, `9e4d7a0`, `97d0ebc` |
| 2 | Стабилизация ядра | ✅ | `4058aed` |
| 3 | Редизайн UI | ✅ | `d85aebc` |
| 4 | CRM — ядро (источники, отказы, исходы, нумерация ПМ) | ✅ | `7b8f206` |
| 5 | Проекты — аудит-фиксы (история, стадии, PR↔Invoice, табы) | ✅ | `269c6d7` |
| 6 | Производство, логистика, монтаж (PROJ-08..11) | 🔜 Следующая | — |
| 7 | Акт, закрытие проекта, гарантия (PROJ-12..14) | ⏳ | — |
| 8 | Финансы (банк-выписка, маржа, долги) | ⏳ | — |
| 9 | Управленческий учёт (P&L, план/факт, ДДС) | ⏳ | — |
| 10 | Задачи, уведомления, аналитика | ⏳ | — |

**Отложено из Фазы 4:** CRM-04 (замер#1/задачи → Фаза 10), CRM-05 (КП с версионированием → Фаза 5/6 после спецификации), CRM-08 (бонус дизайнера → Фаза 8).

### Что сделано в этой сессии (Фазы 4+5)

**Фаза 4 — CRM (ядро):**
- `Deal.sourceId` FK + 10 канонических источников лида (seed + API + UI Select)
- `lossReason` обязателен при переводе в lost (валидация в moveStage)
- Единая нумерация `ПМ{год}-NNNN` (общая для проекта и договора)
- Автосоздание проекта+договора: `POST /api/deals/[id]/convert-to-project`
- Дни до конца проекта на карточке сделки (project.endDate)
- Статус won/lost с closedAt/actualCloseDate

**Фаза 5 — Аудит-фиксы:**
- `ProjectStatusHistory` — запись при смене статуса + UI (StatusHistoryCard)
- Автосоздание 7 ProjectStage при создании проекта (measurement_2→closure)
- `Invoice.purchaseRequestId` FK (связь счёт↔заказ)
- Фикс вкладок контрагента (были `data={[]}`, теперь реальные данные)
- PROJ-07 трекер покрытия: бейдж «X/Y заказано» в BOMSection
- BOM lock enforced в `PATCH /api/bom/items/[id]`

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

## 4. Текущая схема БД (ключевые модели)

**CRM:** Deal (sourceId, lossReason, projectId, contractId, stageId, pipelineId, contactId), DealStage (isWonStage, isLostStage), DealHistory, Pipeline, LeadSource (10 канонических), Contact, Contract, ContractVersion, ContractSigner

**Проекты:** Project (status, dealId), ProjectStage (7 автосоздаются: measurement_2→closure), ProjectStatusHistory, ProjectMember, Production, ProductionStage

**Спецификация/Закупки:** BOM (1:1 Project, locked/draft), BOMItem (supplierId), PurchaseRequest (draft→sent→responded→partial→closed), PurchaseRequestItem (bomItemId), Invoice (purchaseRequestId FK), InvoiceItem (bomItemId, isMatch), Counterparty, WarehouseItem (availableQty), WarehouseTransaction

**Финансы:** Transaction, CashFlowPayment, Category, Budget, BankStatement, BankTransaction

**Платформа:** User, Role, UserRole, AuditLog, Notification, Task, Event, FileEntity

**Всего моделей:** 62 (было 58, +4 в фазах 4-5)

---

## 5. Глобальное состояние модулей (аудит 2026-06-29)

| Модуль | Готовность | Ключевые пробелы |
|--------|-----------|------------------|
| 🔐 **RBAC** | 100% | — |
| 🎨 **UI/UX** | 90% | Глобальный поиск отсутствует |
| 📊 **CRM** | 90% | КП (CRM-05), замер#1 (CRM-04), UI пайплайнов |
| 📁 **Проекты** | 85% | Нет статус-машины (completed→lead разрешён), склад не связан с закупками |
| 🛒 **Закупки** | 80% | Email — log-only (SMTP отложен), нет AI-автосверки |
| 📦 **Склад** | 70% | Не интегрирован с закупками (availableQty не проверяется) |
| 💰 **Финансы** | 60% | Дашборд/транзакции/категории работают. Нет: банк-выписки, P&L, план/факта, ДДС |
| 📈 **Учёт** | 10% | Только модели в БД, UI не начат |
| 📋 **Задачи** | 5% | Модель Task есть, но API и UI отсутствуют |
| 🔔 **Уведомления** | 20% | Модель Notification есть, Approval создаёт. Нет Telegram/email каналов |

---

## 6. Как вести разработку

1. Создай `.planning/phases/0N-<slug>/0N-CONTEXT.md` и `0N-PLAN.md` (как в `01-rbac/`, `04-crm/`).
2. Реализуй, проверь (`tsc --noEmit` + smoke через curl с cookie), закоммить.
3. Напиши `0N-VERIFICATION.md` + `0N-SUMMARY.md`.
4. Обнови `.planning/STATE.md` (progress, milestone registry).

**Коммиты — Conventional Commits** (`feat:`, `fix:`, `docs:`), трейлер `Co-Authored-By: Claude <noreply@anthropic.com>`. Репо коммитит **в `main`** напрямую.

---

## 7. Что делать дальше (Фаза 6)

**Задачи PROJ-08..11:**
1. **PROJ-08:** Производство-аутсорс — назначение партнёра с тегами-навыками, режим материала, воронка производства
2. **PROJ-09:** Логистика/доставка — фиксация поставщик→производство, производство→объект, стоимость как расход
3. **PROJ-10:** Прогрессивный монтаж — многозаходный, 30% перед началом, статусы «приступили/закончили»
4. **PROJ-11:** Доп. работы — формальное оформление (доп. соглашение/отдельный договор)

**Быстрые фиксы (можно перед Фазой 6):**
- Статус-машина проекта (запрет completed→lead)
- Склад→закупки интеграция (показ availableQty в PR create dialog)
- Убрать дублирующие эндпоинты конвертации сделки

**Инфраструктурные долги:**
- 16 `console.error` в прод-компонентах (заменить на logger)
- `changedBy` deprecated field в DealMoveInput (клиент всё ещё передаёт)
- Не все API routes используют `mapErrorToResponse`
- BOM lock not enforced при удалении BOMItem (только PATCH)

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
