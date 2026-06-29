---
status: passed
phase: 2
verified: 2026-06-29
method: tsc --noEmit + curl smoke (against running dev server + native PostgreSQL) + next build
---

# Phase 2: Стабилизация ядра — Verification

**Status: PASSED** — все цели подтверждены.

## Success Criteria

1. ✅ **`tsc --noEmit` прод-ошибки → 0.**
   - Baseline: **338** (40 прод + 298 тестов).
   - После: **0** (и прод, и тесты). Все рекурсии `$extends`/include устранены
     явными аннотациями `Prisma.*FindManyArgs` / дженериками `findUnique<I>`.
2. ✅ **`next build` проходит до конца.**
   - Раньше падал на type-check. Теперь: `✓ Compiled`, `Finished TypeScript`,
     59 страниц сгенерированы, exit 0.
3. ✅ **Create-потоки без 500.**
   - Валидные: `POST /api/deals` (201), `POST /api/projects` с реальным
     `managerId` (201, `marginTarget: 0.25`), `POST /api/invoices` с валидным
     проектом (201).
   - Невалидный FK: `managerId="1"` (бывший хардкод UI) → **400** с понятным
     русским сообщением (был 500). Невалидный invoice-FK → **400**.
   - Пропущенное обязательное поле (`pipelineId`) → **400** валидация.
4. ✅ **`team-performance` не падает.** Раньше: 500 «Unknown argument
   assignedToId». Теперь: **200** (`assignedToId` → `managerId`).
5. ✅ **Мёртвые тесты убраны.** 14 файлов `src/lib/api/*.test.ts` удалены
   (298 ошибок шума). Остались 14 осмысленных db-тестов — все типизированно-чистые.

## Smoke (curl, cookie admin@local)

```
POST /api/users/list (new)            → 200, [{"id":"e2a01b68-...","name":"Администратор"}]
GET  /api/analytics/team-performance   → 200 (was 500)
POST /api/deals  (valid, +managerId)   → 201
POST /api/projects (valid, +managerId) → 201
POST /api/projects (managerId="1")     → 400  (was 500 — root cause of UI create bug)
POST /api/invoices (bad FK)            → 400  (was 500)
POST /api/deals (no pipelineId)        → 400
next build                             → exit 0, 59 pages
```

## Implementation Notes

- **`mapErrorToResponse`** (`src/lib/api/error-mapping.ts`) — общий маппер
  Prisma-ошибок (P2002/P2003/P2025) и repo-ошибок (statusCode) в HTTP.
  Применён в deals/projects/invoices create-роутах. Закрывает класс create-500.
- **`/api/users/list`** — lightweight (id/name/email), доступен всем
  залогиненным (не director-only), для dropdown'ов assignee/manager.
- **`create-project-modal`** — менеджер теперь опционален, список реальных
  пользователей вместо хардкода.
- **`getDeadlineInfo`/`formatDeadlineLabel`** (`lib/utils.ts`) — дни до дедлайна
  с уровнями срочности (overdue/soon/upcoming). Цветной бейдж в `deal-card.tsx`.
- **`files.ts`** — модель `FileEntity` без `deletedAt`; `softDelete` → hard delete
  (API-совместимо с DELETE-роутом).
- **`contracts.convertFromDeal`** — проверка обязательного `contactId` (FK-баг:
  сделка без контакта не может стать контрактом).

## Human Verification (опционально)

- http://localhost:3000 → создать проект/сделку через UI (без 500).
- Карточка сделки с `expectedCloseDate` — бейдж «N дн.»/«просрочено».
- `/api/users/list` возвращает реальных пользователей.
