---
id: M005
title: "Закупки"
status: complete
completed_at: 2026-06-24T02:41:45.852Z
key_decisions:
  - Status machine pattern для всех сущностей procurement
  - BOM grouping по поставщикам для оптимизации заказов
  - Atomic stock transactions для консистентности склада
  - Auto warehouse update при поступлении поставки
key_files:
  - apps/backend/src/modules/purchase-request/
  - apps/backend/src/modules/invoice/
  - apps/backend/src/modules/approval-request/
  - apps/backend/src/modules/warehouse/
  - apps/backend/src/modules/delivery/
  - apps/frontend/src/modules/purchase-request/
  - apps/frontend/src/modules/invoice/
  - apps/frontend/src/modules/approval-request/
  - apps/frontend/src/modules/warehouse/
  - apps/frontend/src/modules/delivery/
lessons_learned:
  - Полный stack (repo + API + UI) для каждого domain'a обеспечивает независимость
  - Status machine упрощает отслеживание состояний
  - Auto-update интеграции (warehouse) снижают ручной труд
---

# M005: Закупки

**M005 Закупки завершён — 7/7 slices, полный procurement pipeline от запросов до поставок на склад**

## What Happened

## M005: Закупки — завершён

### Реализованный функционал

**S01-S02:** Контрагенты и BOM (baseline)

**S03: Запросы поставщикам (PurchaseRequest)**
- CRUD, BOM grouping по поставщикам
- Email уведомления
- UI: list, create-from-BOM, detail

**S04: Счета от поставщиков (Invoice)**
- CRUD, ручная загрузка файлов
- Manual matching, reconciliation/diff
- UI: list, upload, detail

**S05: Согласование оплаты (ApprovalRequest)**
- CRUD, create-from-invoice
- Approve/reject workflow
- UI: list, create, decide

**S06: Склад (Warehouse)**
- Items CRUD
- Atomic stock transactions
- UI: list с цветовой индикацией, detail с историей

**S07: Поставки (Delivery)**
- CRUD, create-from-invoice
- Auto warehouse update
- UI: list, status tracking

### Стек реализации
- Backend: Repository + API Routes pattern
- Frontend: List + Detail pattern с модальными формами
- Все domain'ы имеют tests для API clients

### Коммиты
- `3121a2e` - S03 complete
- `dd1fdc3` - S04 complete
- `2cf9439` - S05 complete
- `7dd71d8` - S06 complete
- `35f7310` - S07 complete (M005 all slices done)

## Success Criteria Results

✅ Все slices complete с SUMMARY.md и UAT.md
✅ Код в продакшене (commits подтверждены)
✅ Полный pipeline от BOM до склада работает

## Definition of Done Results

✅ Все 7 slices завершены с SUMMARY.md и UAT.md
✅ Код в продакшене (commits от 3121a2e до 35f7310)
✅ UI функциональность доступна

## Requirement Outcomes

["✅ Core capability: запросы поставщикам, счета, согласование, склад, поставки", "✅ Integration: BOM → PurchaseRequest → Invoice → Approval → Delivery → Warehouse", "✅ UI: все domain'ы имеют list/detail страницы"]

## Deviations

None.

## Follow-ups

None.
