---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: in_progress
last_updated: "2026-06-29T13:20:00.000Z"
last_activity: 2026-06-29 -- Phase 9 (accounting ACCT-01..04: 12 expense articles, org P&L, plan/fact, cashflow) completed
progress:
  total_phases: 10
  completed_phases: 10
  total_plans: 10
  completed_plans: 10
  percent: 100
---

# GSD State

**Active Milestone:** v1.0 «ERP ПРО Мебель — доводка до спеки»
**Active Phase:** ✅ Phase 9 complete — управленческий учёт (12 статей расходов, P&L, план/факт, ДДС)
**Requirements Status:** 51 active · 25 validated · 0 deferred · 0 out of scope

## Project Reference

**Core value:** Единое пространство для всех бизнес-процессов (от закупок до финансов) — одно окно для управления всем циклом сделки/проекта с консистентными данными и прозрачностью статусов.
**Current focus:** Довести единый ERP до продуктового ТЗ — авторизация/RBAC, UI-редизайн, стабилизация ядра, CRM, проектный цикл (закупки/производство/монтаж), финансы, управленческий учёт, платформа (задачи/уведомления/аналитика).
**Canonical sources:** `.planning/REQUIREMENTS.md` (51 REQ-ID) + `.gsd/integration/PRODUCT-SPEC.md`.
**Stack:** Next.js 16 + React 19 + Prisma 6 + PostgreSQL. Каркас из 58 моделей и ~83 API-роутов недоделан — доводим/чиним + добавляем недостающее.

## Current Position

Phase: 1 — COMPLETE
Plan: —
Status: Phase 1 complete
Last activity: 2026-06-28 -- Phase 1 marked complete

### Progress bar

```
[░░░░░░░░░░] 0% — 0/10 phases
```

## Performance Metrics

- Phases defined: 10
- Requirements mapped: 51/51 (100%)
- Plans defined: 0
- Decisions logged: 1

## Milestone Registry

> Прежние записи M001–M010 в старом STATE.md были фикцией (фактическое состояние: авторизации НЕТ, create-потоки падают, ~40 ошибок типов, ~298 битых тестов). Реальный milestone v1.0 стартует с Phase 1 ниже.

- [x] **Phase 1:** Доступ и авторизация (RBAC) — AUTH (5)
- [x] **Phase 2:** Стабилизация ядра — CORE (4)
- [x] **Phase 3:** Редизайн UI — UI (5)
- [x] **Phase 4:** CRM — сделки и КП — CRM (4/8) ✅ 2026-06-29
- [x] **Phase 5:** Проект — стабилизация + аудит-фиксы ✅ 2026-06-29
- [x] **Phase 6:** Производство, логистика, монтаж — PROJ-08..11 (4) ✅ 2026-06-29
- [x] **Phase 5b:** Спецификация и закупки — PROJ-01..07 (7) ✅ 2026-06-29
- [x] **Phase 7:** Акт, закрытие проекта, гарантия — PROJ-12..14 (3) ✅ 2026-06-29
- [x] **Phase 8:** Финансы — FIN-01..06 (6) ✅ 2026-06-29
- [x] **Phase 9:** Управленческий учёт — ACCT-01..04 (4) ✅ 2026-06-29
- [ ] **Phase 10:** Задачи, уведомления, аналитика — PLAT (5)

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

### Todos

- Получить образец файлa банк-выписки 1С/TXT от Озон/Тинькофф (PRODUCT-SPEC п.11, открытый вопрос #4) — для точной доработки парсера FIN-02 (сейчас по стандарту 1C + эвристики).
- Подтвердить матрицу видимости проектов (PRODUCT-SPEC п.1, открытый вопрос #1) — влияет на AUTH-04/AUTH-05.
- Подтвердить каналы уведомлений (Telegram-бот нужен?) — влияет на Phase 10/PLAT-02.
- Собрать дизайн-референсы для «сексуального и плавного» UI — влияет на Phase 3/UI-04.

### Blockers

- Нет активных блокеров roadmap. Известный infra-блокер: Docker Desktop движок HTTP 500 (см. auto-memory `docker-postgres-blocker.md`) — может мешать локальной разработке, но не блокирует планирование.

## Session Continuity

**Last session:** 2026-06-29 — Phase 9 (управленческий учёт ACCT-01..04) завершена. 12 статей постоянных расходов (seed, PRODUCT-SPEC п.6), Budget.projectId → nullable (единая модель плана, partial unique index для орг-бюджетов). P&L организации (доходы − расходы постоянные+проектные, прикидка УСН 15%), план/факт по статьям и периодам, ДДС план/факт по месяцам (отдельно от P&L — по моменту движения денег). Раздел «Учёт» в навигации + 5 страниц (/accounting, /pnl, /plan-fact, /cashflow, /articles). Общий util lib/periods.ts (ранее дублировался) + lib/format.ts. Прогресс 100% (10/10 фаз, 25/51 требований validated).
**Next action:** Запустить планирование Phase 10 (Задачи, уведомления, аналитика — PLAT-01..05) — последняя фаза milestone.
**Resume command:** «Продолжи с Phase 10» — продолжит с дорожной карты задач/уведомлений/аналитики.
