# Phase 2: Стабилизация ядра — Plan

> Утверждённый план (10 шагов). Baseline: 338 tsc-ошибок (40 прод + 298 тестов).

## Шаги

1. **Удалить мёртвые тесты** — 14 файлов `src/lib/api/*.test.ts` (298 ошибок).
2. **Type-drift в db-слое** — `*CreateInput` вернуть опциональные
   `id/number/createdAt/updatedAt` через `Partial<Pick<...>>` (паттерн из
   `production.ts`). `files.ts` — убрать `deletedAt` (нет в модели). Рекурсии
   include — явные аннотации `Prisma.*FindManyArgs`.
3. **API-роуты/аналитика** — `team-performance`: `assignedToId` → `managerId`.
   `productions/route.ts`: `Record` → `ProductionCreateInput`.
4. **type-layer** — `types.ts`: импорт `Category`. `api/contracts.ts`: импорт `DealData`.
5. **`[id]/page.tsx`** — устаревший `use(params)`/`Promise` → каноничный
   `useParams<{id:string}>()` (client). `projects/[id]` — `handlePreviewSpec`.
6. **Create-500 из UI** — убрать хардкод `managerId="1"`, новый lightweight
   `/api/users/list` для dropdown'ов. Превентивно: Prisma P2003/P2002/P2025 →
   понятные 400/409/404 через общий `mapErrorToResponse`.
7. **Дни до конца на карточке сделки** — `deal-card.tsx` + утилиты
   `getDeadlineInfo`/`formatDeadlineLabel` в `lib/utils.ts`.
8. **file-preview.tsx** — `DialogClose asChild` → `render` (Radix v2).
   db-тесты include — дженерик-сигнатуры `findUnique`.
9. **Верификация** — `tsc --noEmit` → 0; smoke create (валидные 201,
   невалидные FK → 400); `next build` до конца.
10. **Документы фазы + commit/push**.

## Решения пользователя

- Тесты: **удалить** (ценность низкая, API-клиент прост).
- Дедлайн сделки: считать по **`deal.expectedCloseDate`**.
