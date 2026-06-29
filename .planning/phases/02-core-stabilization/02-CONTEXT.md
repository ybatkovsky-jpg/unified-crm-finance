# Phase 2: Стабилизация ядра — Context

> Фаза стабилизации после фазы 1 (RBAC). Цель — сделать ядро пригодным для
> дальнейшей разработки: починить create-потоки, убрать type-drift, очистить
> мёртвые тесты, чтобы `tsc --noEmit` и `next build` проходили чисто.

## Зачем эта фаза

Каркас приложения (58 моделей, ~83 API-роута) был недоделан: создание
сделки/проекта/инвойса падало с 500, `next build` ломался на type-check
(338 ошибок), ~298 из них — мёртвые тесты API-клиента.

Без стабилизации невозможно уверенно строить функциональные модули (фазы 4+):
каждое изменение тонет в шуме сломанных типов и непредсказуемых 500.

## Замер на старте (baseline)

`npx tsc --noEmit` = **338 ошибок**:
- **40 прод** (блокируют `next build`)
- **298 тестов** (вне build-графа, но шумят)

## Корневые причины (по результатам разведки)

### Create-500
- API-роуты `/api/deals`, `/api/projects`, `/api/invoices` **функционально
  работали** (создание через curl с валидными ID → 201).
- Реальный 500 шёл из **UI-форм**: `create-project-modal.tsx` хардкодил
  `managerId="1"` (не UUID) → FK-нарушение → сырой 500.
- Невалидные FK во всех create-роутах отдавали сырой 500 вместо понятного 400.

### Type-drift
- `*CreateInput` в репозиториях через `Omit` убирал `id/number/createdAt/updatedAt`,
  но `create()` их читал (`projects.ts`, `deals.ts`, `contracts.ts`, `notifications.ts`).
- `files.ts` фильтровал по `deletedAt`, которого **нет** в модели `FileEntity`.
- `team-performance` использовал `assignedToId` (поля не существует) вместо `managerId`.
- `types.ts` — `Category` не импортирован; `api/contracts.ts` — `DealData` не импортирован.
- `productions/route.ts` — `Record<string,unknown>` вместо `ProductionCreateInput`.
- 6 файлов `[id]/page.tsx` — устаревший паттерн `use(params)` / `params: Promise`.
- Рекурсия типов (`Excessive stack depth`) в Prisma-репозиториях из-за `$extends`
  query-extension + спред локального объекта в `findMany`/`findUnique`.

### Мёртвые тесты
14 файлов `src/lib/api/*.test.ts` — обращались к приватному `fetchFn`, моки
`Response` не совпадали с реальным API-клиентом. Не запускались (нет runner'а).

## Границы фазы (не входит)

- Реальная матрица видимости проектов — фаза 4.
- Источники лида, КП-версионирование, отказы — фаза 4 (CRM).
- Банк-импорт — фаза 8.

## Стек / окружение

Next.js 16 (Turbopack) + React 19 + Prisma 6 + PostgreSQL 16 (нативно).
Dev: `cd apps/web && npx next dev -p 3000`. Логин: admin@local / admin123.
Подробности — в `.gsd/integration/HANDOFF.md`.
