# Phase 8 Verification

**Date:** 2026-06-29
**Requirements:** FIN-01, FIN-02, FIN-03, FIN-04, FIN-05, FIN-06

## Type Check
- [x] `tsc --noEmit` — 0 ошибок (полный прогон, весь проект)

## API Smoke Tests (authed as director, project ПМ2026-0001, contractAmount=150000)

### FIN-01 — Платежи 70/30
- [x] `GET /api/projects/[id]/payments` — авто-созданы 2 этапа: prepayment 105000 (70%) + final 45000 (30%)
- [x] `GET /api/projects/[id]/payments/coverage` — received 0/150000 (0%), prepaymentMet=false, fullyPaid=false
- [x] `POST /api/project-payments/[id]/record` (105000, cash) — received 105000/105000, status=paid, paymentMethod=cash
- [x] coverage после платежа — received 105000/150000 (70%), **prepaymentMet=true**, fullyPaid=false

### FIN-02 — Импорт банк-выписки
- [x] `POST /api/finance/statements/import` (1C Client-Bank test file) — 2 транзакции, totalIncome=45000, totalExpense=30000
- [x] Направления корректны: incoming 45000 (ООО Ромашка) + outgoing 30000 (ИП Иванов)
- [x] `POST /api/finance/statements/[id]/match` — total=1, matched=0, unmatched=1 (нет Invoice с совпадающим контрагентом — ожидаемо)
- [x] INN извлекается корректно (7712345678, 770012345678)

### FIN-03 — Способ оплаты
- [x] Transaction принимает paymentMethod (запись платежа через ProjectPayment сохранила paymentMethod=cash)
- [x] transaction-form.tsx — Select «Способ оплаты» (Наличные/Безнал/Карта)

### FIN-04 — Маржа + alert
- [x] `GET /api/analytics/margin` — возвращает expenseBreakdown (materials/delivery/changeOrders/designerBonus), marginTargetPct, lowMargin
- [x] lowMarginAlerts: проект «монтаж кухни на культуре» — margin 0% < target 25%

### FIN-05 — Долги
- [x] `GET /api/finance/debts` — receivables (2 проекта, дебиторка 1545000) + payables (1, кредиторка 5000) + totals

### FIN-06 — Бонус дизайнера
- [x] `PUT /api/projects/[id]/designer-bonus` — amount=15000 (10% от 150000)
- [x] `PATCH mark-paid` без override при недоплате (105000/150000) → **409** ConflictError
- [x] `PATCH mark-paid` с overrideUnmet=true → **200**, status=paid, paidAt проставлен
- [x] `GET /api/finance/designer-debt` — сводка накопленного долга (пуста для бонусов без designerId — ожидаемо)

## DB Migration
- [x] Миграция `phase8_finance_payments` применена (ProjectPayment, Transaction.paymentMethod/paymentType)
- [x] Prisma client пересоздан

## UI Verification
- [x] Секция «Платежи клиента» на странице проекта (этапы, прогресс, диалог)
- [x] Раздел /finance/statements (загрузка, список, сверка, подтверждение)
- [x] Раздел /finance/debts (дебиторка/кредиторка)
- [x] Блок low-margin на странице аналитики маржи
- [x] Nav: «Банк-выписки» + «Долги» в разделе Финансы
