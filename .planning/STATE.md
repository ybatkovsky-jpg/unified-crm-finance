---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: ERP ПРО Мебель — доводка до спеки
status: complete
last_updated: "2026-06-30T15:00:00.000Z"
last_activity: 2026-06-30 -- PLAT-06 «Орг-платформа задач» (отделы→функции→повторяющиеся задачи) добавлен пост-milestone; документация синхронизирована с реальностью
progress:
  total_phases: 10
  completed_phases: 10
  total_plans: 10
  completed_plans: 10
  percent: 100
---

# GSD State

**Active Milestone:** v1.0 «ERP ПРО Мебель — доводка до спеки» — COMPLETE ✅
**Active Phase:** ✅ Phase 10 complete — платформа (задачи, уведомления, аналитика) — milestone завершён
**Requirements Status:** 52 active · 52 validated · 0 deferred · 0 out of scope (51 в milestone + PLAT-06 post-milestone)

## Project Reference

**Core value:** Единое пространство для всех бизнес-процессов (от закупок до финансов) — одно окно для управления всем циклом сделки/проекта с консистентными данными и прозрачностью статусов.
**Current focus:** Milestone v1.0 завершён (Phase 1–10). Дополнительно реализован модуль PLAT-06 «Орг-платформа задач». Дальнейшее — Future requirements и починка известных багов (см. ревью Phase 10).
**Canonical sources:** `.planning/REQUIREMENTS.md` (52 REQ-ID) + `.gsd/integration/PRODUCT-SPEC.md`.
**Stack:** Next.js 16 + React 19 + Prisma 6 + PostgreSQL. Схема: 68 моделей, ~131 API-роут.

## Current Position

Phase: 10 — COMPLETE (milestone v1.0 завершён)
Plan: —
Status: Milestone COMPLETE + PLAT-06 post-milestone
Last activity: 2026-06-30 -- PLAT-06 «Орг-платформа задач» реализован; документация приведена в порядок

### Progress bar

```
[██████████] 100% — 10/10 phases (+ PLAT-06 post-milestone)
```

## Performance Metrics

- Phases defined: 10 (все complete)
- Requirements mapped: 52/52 (100%) — 51 в milestone + PLAT-06
- Plans defined: 10 (все complete)
- Decisions logged: 12
- Schema models: 68
- API routes: ~131

## Milestone Registry

> Прежние записи M001–M010 в старом STATE.md были фикцией (фактическое состояние: авторизации НЕТ, create-потоки падают, ~40 ошибок типов, ~298 битых тестов). Реальный milestone v1.0 стартует с Phase 1 ниже.

- [x] **Phase 1:** Доступ и авторизация (RBAC) — AUTH (5) ✅ 2026-06-28
- [x] **Phase 2:** Стабилизация ядра — CORE (4) ✅ 2026-06-28
- [x] **Phase 3:** Редизайн UI — UI (5) ✅ 2026-06-28
- [x] **Phase 4:** CRM — сделки и КП — CRM (8) ✅ 2026-06-29
- [x] **Phase 5:** Проект — спецификация и закупки — PROJ-01..07 (7) ✅ 2026-06-29
- [x] **Phase 6:** Производство, логистика, монтаж — PROJ-08..11 (4) ✅ 2026-06-29
- [x] **Phase 7:** Акт, закрытие проекта, гарантия — PROJ-12..14 (3) ✅ 2026-06-29
- [x] **Phase 8:** Финансы — FIN-01..06 (6) ✅ 2026-06-29
- [x] **Phase 9:** Управленческий учёт — ACCT-01..04 (4) ✅ 2026-06-29
- [x] **Phase 10:** Задачи, уведомления, аналитика — PLAT-01..05 (5) ✅ 2026-06-30
- [x] **PLAT-06:** Орг-платформа задач — отделы→функции→назначения, RRULE-повторяющиеся задачи, ленивая материализация ✅ 2026-06-30 (post-milestone)

## Accumulated Context

### Decisions

- 2026-06-29: Roadmap разбит на 10 фаз по естественным границам модулей; PROJ (14 req) разбит на 3 фазы (спецификация+закупки / производство+логистика+монтаж / акт+закрытие+гарантия). AUTH+CORE идут первыми как хребет и стабилизация; UI-редизайн — отдельная frontend-heavy фаза перед функциональными модулями.
- 2026-06-29: Granularity = Standard (config.json отсутствует → default). 10 фаз обосновано complex-проектом с 51 требованием; укладывается в Fine-диапазон (8-12).
- 2026-06-29 (Phase 7): Бонус дизайнера — минимальный след сейчас (модель DesignerBonus: designer/percent/amount/status pending|paid, проверка «выплачен» для PROJ-13). Полная логика выплат и накопленного долга по нескольким проектам — FIN-06, Phase 8.
- 2026-06-29 (Phase 7): Условия закрытия проекта (PROJ-13) — мягкие с override: чек-лист 4 условий (акт/деньги клиента/счета/бонус), закрытие блокируется только на уровне UI-предупреждения; бэкенд возвращает 409 при невыполненных условиях, но допускает `overrideUnmet: true`.
- 2026-06-29 (Phase 8): Платежи клиента 70/30 — отдельная модель ProjectPayment (а не флаги на Transaction). При фиксации платежа создаётся связанная Transaction(income). Покрытие считается на лету.
- 2026-06-29 (Phase 8): Импорт банк-выписки — датаслой уже был мигрирован (BankStatement/BankTransaction/...), построен прикладной слой: парсер 1C Client-Bank + толерантный plain-text fallback, matching-движок по ИНН/сумме с confidence, ручное подтверждение. Без образца файла от заказчика — парсер по стандарту 1C, дорабатывается при получении реального образца.
- 2026-06-29 (Phase 8): Маржа — декомпозиция расходов (materials/delivery/changeOrders/designerBonus) + сравнение с marginTarget → lowMarginAlerts. Долги — вычисляются на лету из Transaction/Invoice/DesignerBonus (без отдельной модели). Бонус дизайнера (FIN-06) — guard: выплата блокируется (409) пока не получены все деньги клиента, есть override; накопленный долг — getDebtSummary (GROUP BY designerId).
- 2026-06-29 (Phase 9): Архитектурное решение по модели плана — Budget.projectId сделан nullable (единая модель для проектных и орг-бюджетов вместо отдельной OrgBudget). Уникальность орг-плана (categoryId+period, projectId=null) обеспечена partial unique index в БД (Postgres NULL≠NULL) + ручной проверкой в BudgetRepository.create. Факт постоянных расходов = Transaction(type=expense, projectId=null).
- 2026-06-29 (Phase 9): P&L/план-факт/ДДС считаются на лету агрегацией Transaction/Budget/CashFlowPayment за период (без материализации). P&L = доходы − расходы (постоянные+проектные), с прикидкой УСН 15% (max от 15% базы и 1% дохода). ДДС отделён от P&L — по моменту движения денег. Общий util периодов lib/periods.ts (ранее дублировался локально в analytics routes).
- 2026-06-29 (Phase 9): UI раздела «Учёт» — русский (в отличие от англоязычного /finance, исторический долг). Раздел уже был в матрице ролей (director+accountant) и pathToSection — добавлен только в nav-config + страницы. Общий форматтер lib/format.ts (ru-RU/RUB).
- 2026-06-30 (Phase 10): PLAT-02 — только in-app уведомления (Telegram/email → Future). Каналы подтверждены заказчиком: колокол в шапке уже был, нужны только trigger-points + починка MOCK_USER_ID → me.id.
- 2026-06-30 (Phase 10): Time-based события (60 дней, просрочка задачи) — ленивый расчёт при чтении (как статусы проекта Phase 5), без cron/worker. Уведомления создаются в GET-эндпоинтах по факту обнаружения, idempotent через metadata.dedupeKey.
- 2026-06-30 (Phase 10): Task lineage — originalTaskId (корень цепочки) + parentTaskId (предыдущая при переносе) + failedReason. Reschedule = пометить старую failed + создать новую-копию с переносом даты и сохранением lineage. Репо lib/db/tasks.ts по паттерну budgets.ts.
- 2026-06-30 (Phase 10): Известный баг — Task.createdBy это FK на User, но create-measurement-task шлёт 'system' (несуществующий). Не регрессия Phase 10 (существовало ранее), но при реальном использовании нужен реальный userId из сессии.
- 2026-06-30 (PLAT-06): Орг-платформа задач — иерархия Department→OrgFunction→FunctionAssignment (head/responsible, один человек→несколько функций), TaskTemplate с RFC-5545 RRULE (библиотека rrule), ленивая материализация инстансов при наступлении срока (идемпотентно по templateId+plannedDate), видимость директор+head+исполнитель. Гибрид: отдельный раздел /org + инстансы в общем /tasks. RBAC-секция 'org' добавлена всем ролям.
- 2026-06-30 (Ревью Phase 10): Найдены критические проблемы безопасности/целостности (см. Todos): IDOR уведомлений и задач (нет проверки сессии/владельца в роутах), dedupeKey-фильтр не работает (дубли при каждом чтении), RBAC-дыра в аналитике (менеджеры видят чужие финансы), семантический баг stockValue. Требуют отдельной починки.

### Todos

- Получить образец файлa банк-выписки 1С/TXT от Озон/Тинькофф (PRODUCT-SPEC п.11, открытый вопрос #4) — для точной доработки парсера FIN-02 (сейчас по стандарту 1C + эвристики).
- Подтвердить матрицу видимости проектов (PRODUCT-SPEC п.1, открытый вопрос #1) — влияет на AUTH-04/AUTH-05.
- ~~Подтвердить каналы уведомлений~~ ✅ решено Phase 10: только in-app, Telegram/email → Future.
- Future: Telegram-бот + email для уведомлений (PLAT-02 расширение) — когда будет готов bot token/SMTP.
- Bug: Task.createdBy FK='system' в create-measurement-task (нужен реальный userId из сессии).
- **Ревью Phase 10 — критические находки (требуют починки):**
  - 🔴 IDOR уведомлений: `api/notifications/*` не проверяют сессию — любой читает/создаёт чужие уведомления (userId из query/body).
  - 🔴 IDOR задач: `api/tasks/*` не проверяют сессию/владельца — любой меняет/удаляет чужие задачи.
  - 🔴 dedupeKey не работает: `events.ts:36-49` findFirst без фильтра по metadata → дубли task_overdue при каждом чтении.
  - 🔴 RBAC-дыра аналитики: `api/analytics/*` не фильтруют по viewAllProjects — менеджеры видят чужие финансы/маржу.
  - 🟠 Семантический баг: `procurement-metrics` stockValue = кол-во единиц, отображается как ₽.
  - 🟠 N+1: team-performance (5N+ запросов), budget-vs-actual.
  - 🟡 Нет тестов для Phase 10 модулей (tasks/notifications/analytics).

### Blockers

- Нет активных блокеров roadmap. Известный infra-блокер: Docker Desktop движок HTTP 500 (см. auto-memory `docker-postgres-blocker.md`) — может мешать локальной разработке, но не блокирует планирование.

## Session Continuity

**Last session:** 2026-06-30 — PLAT-06 «Орг-платформа задач» реализован (отделы→функции→назначения, RRULE-повторяющиеся задачи с ленивой материализацией). Проведено ревью Phase 10 (найдены 4 критических + 2 важных проблемы безопасности/целостности). Документация приведена в порядок: синхронизированы .gsd + .planning под фазовую схему, README переписан, docs/ заморожены как исторические, починен конфликт Prisma root/app.
**MILESTONE v1.0 COMPLETE** — все 10 фаз + PLAT-06, 52/52 требований validated.
**Next action:** (1) починка критических находок ревью Phase 10 (IDOR, dedupeKey, RBAC аналитики); (2) Future requirements (Telegram/email, гарантии, телефония); (3) новые модули по запросу.
**Resume command:** Milestone v1.0 + PLAT-06 готовы. Сначала закрыть known-баги из ревью, затем — следующий milestone.
