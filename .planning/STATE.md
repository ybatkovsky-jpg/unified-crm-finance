---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: "ERP ПРО Мебель — доводка до спеки"
status: planning
last_updated: "2026-06-29T00:00:00.000Z"
last_activity: 2026-06-29
progress:
  total_phases: 10
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# GSD State

**Active Milestone:** v1.0 «ERP ПРО Мебель — доводка до спеки»
**Active Phase:** Phase 1 — Доступ и авторизация (RBAC)
**Requirements Status:** 51 active · 0 validated · 0 deferred · 0 out of scope

## Project Reference

**Core value:** Единое пространство для всех бизнес-процессов (от закупок до финансов) — одно окно для управления всем циклом сделки/проекта с консистентными данными и прозрачностью статусов.
**Current focus:** Довести единый ERP до продуктового ТЗ — авторизация/RBAC, UI-редизайн, стабилизация ядра, CRM, проектный цикл (закупки/производство/монтаж), финансы, управленческий учёт, платформа (задачи/уведомления/аналитика).
**Canonical sources:** `.planning/REQUIREMENTS.md` (51 REQ-ID) + `.gsd/integration/PRODUCT-SPEC.md`.
**Stack:** Next.js 16 + React 19 + Prisma 6 + PostgreSQL. Каркас из 58 моделей и ~83 API-роутов недоделан — доводим/чиним + добавляем недостающее.

## Current Position

Phase: 1 (Доступ и авторизация) — Not started
Plan: —
Status: Roadmap ready, awaiting `/gsd:plan-phase 1`
Last activity: 2026-06-29 — ROADMAP.md created (10 phases, 51 requirements mapped)

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

- [ ] **Phase 1:** Доступ и авторизация (RBAC) — AUTH (5)
- [ ] **Phase 2:** Стабилизация ядра — CORE (4)
- [ ] **Phase 3:** Редизайн UI — UI (5)
- [ ] **Phase 4:** CRM — сделки и КП — CRM (8)
- [ ] **Phase 5:** Проект — спецификация и закупки — PROJ-01..07 (7)
- [ ] **Phase 6:** Производство, логистика, монтаж — PROJ-08..11 (4)
- [ ] **Phase 7:** Акт, закрытие проекта, гарантия — PROJ-12..14 (3)
- [ ] **Phase 8:** Финансы — FIN (6)
- [ ] **Phase 9:** Управленческий учёт — ACCT (4)
- [ ] **Phase 10:** Задачи, уведомления, аналитика — PLAT (5)

## Accumulated Context

### Decisions

- 2026-06-29: Roadmap разбит на 10 фаз по естественным границам модулей; PROJ (14 req) разбит на 3 фазы (спецификация+закупки / производство+логистика+монтаж / акт+закрытие+гарантия). AUTH+CORE идут первыми как хребет и стабилизация; UI-редизайн — отдельная frontend-heavy фаза перед функциональными модулями.
- 2026-06-29: Granularity = Standard (config.json отсутствует → default). 10 фаз обосновано complex-проектом с 51 требованием; укладывается в Fine-диапазон (8-12).

### Todos

- Получить образец файлa банк-выписки 1С/TXT от Озон/Тинькофф для Phase 8 (PRODUCT-SPEC п.11, открытый вопрос #4).
- Подтвердить матрицу видимости проектов (PRODUCT-SPEC п.1, открытый вопрос #1) — влияет на AUTH-04/AUTH-05.
- Подтвердить каналы уведомлений (Telegram-бот нужен?) — влияет на Phase 10/PLAT-02.
- Собрать дизайн-референсы для «сексуального и плавного» UI — влияет на Phase 3/UI-04.

### Blockers

- Нет активных блокеров roadmap. Известный infra-блокер: Docker Desktop движок HTTP 500 (см. auto-memory `docker-postgres-blocker.md`) — может мешать локальной разработке, но не блокирует планирование.

## Session Continuity

**Last session:** 2026-06-29 — создан ROADMAP.md, обновлён STATE.md, заполнена Traceability в REQUIREMENTS.md.
**Next action:** Запустить `/gsd:plan-phase 1` для декомпозиции Phase 1 (Доступ и авторизация) в исполняемые планы.
**Resume command:** «Продолжи с plan-phase 1» — продолжит с ROADMAP Phase 1.
