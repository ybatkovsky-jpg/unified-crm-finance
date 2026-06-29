---
phase: 2
status: complete
completed: 2026-06-29
---

# Phase 2: Стабилизация ядра — Summary

**Результат:** ядро стабилизировано. `tsc --noEmit` → **0** (с 338), `next build`
проходит до конца (раньше падал на type-check), create-потоки сделки/проекта/
инвойса работают без 500, мёртвые тесты убраны.

## Что сделано

### Create-500 (корневая причина найдена и устранена)
- API-роуты работали — 500 шли из UI: `create-project-modal` хардкодил
  `managerId="1"` (не UUID → FK-нарушение → 500).
- Убран хардкод → загрузка реальных пользователей через новый `/api/users/list`.
- Общий `mapErrorToResponse`: Prisma P2003 (FK) / P2002 (unique) / P2025 (not found)
  → понятные 400/409/404 вместо сырого 500. Применён в deals/projects/invoices.
- `team-performance`: `assignedToId` → `managerId` (чинит «Unknown argument» 500).

### Type-drift (40 прод-ошибок → 0)
- `*CreateInput` (deals/projects/contracts/notifications): `Partial<Pick<...>>`
  для опциональных `id/number/createdAt/updatedAt`.
- `files.ts`: `FileEntity` без `deletedAt` — убраны 5 фильтров; `softDelete`→hard.
- `types.ts`: импорт `Category`; `api/contracts.ts`: импорт `DealData`.
- `productions/route.ts`: `Record<string,unknown>` → `ProductionCreateInput`.
- 6 файлов `[id]/page.tsx`: `use(params)`/`Promise` → `useParams<{id:string}>()`.
- `file-preview.tsx`: `DialogClose asChild` → `render` (Radix v2).
- **Рекурсии `Excessive stack depth`** во всех Prisma-репозиториях (`$extends`
  + спред): явные аннотации `Prisma.*FindManyArgs` + дженерики `findUnique<I>`.

### Фичи
- **Дни до конца сделки** на карточке: `getDeadlineInfo`/`formatDeadlineLabel`
  (`lib/utils.ts`) + цветной бейдж (overdue/soon/upcoming) в `deal-card.tsx`.
- **`/api/users/list`** — lightweight список для dropdown'ов.

### Приборка
- Удалено 14 мёртвых тестов `src/lib/api/*.test.ts` (298 ошибок шума).
- 14 db-тестов — живые, типизированно-чистые.

### Бонус (выявлено при build)
- `/login` — `useSearchParams()` требовал Suspense → обёрнут в `<Suspense>`
  (блокировал статическую prerender-генерацию).

## Метрики

| Метрика | До | После |
|---|---|---|
| `tsc --noEmit` (всего) | 338 | **0** |
| прод-ошибки | 40 | **0** |
| тест-ошибки | 298 | **0** |
| `next build` | падал (type-check) | **exit 0** |
| create deal/project/invoice (валидные) | 500 | **201** |
| create с невалидным FK | 500 | **400** |
| `team-performance` | 500 | **200** |

## Что НЕ делалось (вне фазы)

Реальная матрица видимости проектов, источники лида, КП-версионирование,
банк-импорт — фазы 4–8.

## Следующая фаза

**Фаза 3 — UI-редизайн:** левый сайдбар + верхний поднав + плавный motion-дизайн
(«сексуальный и плавный» по спеке). Теперь, когда ядро стабильно и build чист,
можно уверенно перестраивать UI.
