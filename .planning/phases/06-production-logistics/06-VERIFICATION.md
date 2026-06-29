# Phase 6 Verification

**Date:** 2026-06-29  
**Requirements:** PROJ-08, PROJ-09, PROJ-10, PROJ-11

## Type Check
- [x] `tsc --noEmit` — 0 ошибок (продакшн-код)

## API Smoke Tests
- [x] `GET /api/counterparties?type=supplier` — возвращает партнёров с тегами-навыками (types JSON)
- [x] `POST /api/projects/[id]/installations` — создаёт заход на монтаж (planned, 30% аванс)
- [x] `PATCH /api/installations/[id]/status` — статус-машина работает:
  - planned → advance_paid (аванс получен)
  - advance_paid → started (actualStartDate проставлен)
  - started → completed (actualEndDate проставлен)
- [x] `POST /api/projects/[id]/change-orders` — создаёт доп. работу (draft)
- [x] `PATCH /api/change-orders/[id]` (status=approved) — утверждение (approvedAt проставлен)
- [x] Production API принимает `partnerId` и `materialMode`
- [x] Delivery API принимает `deliveryType`, `fromLocation`, `toLocation`, `cost`

## UI Verification
- [x] Форма контрагента — выбор тегов-навыков (multi-select chips)
- [x] Создание производства — выбор партнёра с показом тегов, выбор materialMode
- [x] Список производств — показ партнёра и materialMode
- [x] Карточка производства — детали партнёра и режима материала
- [x] Секция «Монтаж» на странице проекта
- [x] Секция «Доп. работы» на странице проекта
- [x] Таб «Поставки» на странице контрагента (больше не пустой)
- [x] Форма создания доставки — поля type/from/to/cost

## DB Migration
- [x] Миграция `phase6_production_logistics_install` применена
- [x] Seed: 3 production-партнёра с тегами-навыков
