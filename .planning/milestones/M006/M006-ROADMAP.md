# M006: Финансы

**Vision:** Модуль Финансы обеспечивает полный финансовый контроль: бюджетирование проектов, учёт всех транзакций, планирование платежей (CashFlowPayment), и интеграция с счетами поставщиков. Пользователь может видеть финансовое состояние каждого проекта, отслеживать доходы/расходы, и планировать платежи.

## Success Criteria

- Пользователь может создавать и управлять категориями доходов/расходов
- Пользователь может устанавливать бюджеты на проекты по категориям и периодам
- Пользователь может записывать доходы и расходы с привязкой к проектам, контрагентам, счетам
- Пользователь может планировать платежи (planned → scheduled → paid)
- Оплата счета автоматически создаёт Transaction и обновляет Invoice.paidAt
- Финансовый дашборд показывает агрегированные данные: balance, budgets, upcoming payments

## Slices

- [ ] **S01: S01** `risk:medium` `depends:[]`
  > After this: After this: Пользователь может создавать и управлять иерархией категорий доходов/расходов через UI (list + detail страницы)

- [ ] **S02: Бюджеты проектов** `risk:medium` `depends:[S01]`
  > After this: After this: Пользователь может устанавливать бюджет на проект по категории и периоду (месяц/квартал/год)

- [ ] **S03: Транзакции (доходы и расходы)** `risk:high` `depends:[S01]`
  > After this: After this: Пользователь может записывать доходы и расходы с привязкой к проекту, категории, контрагенту, счёту

- [ ] **S04: Планирование платежей (CashFlowPayment)** `risk:medium` `depends:[S01]`
  > After this: After this: Пользователь может планировать платежи (planned → scheduled → paid) с привязкой к проекту, контрагенту, счёту

- [ ] **S05: Финансовая аналитика и отчёты** `risk:low` `depends:[S02,S03,S04]`
  > After this: After this: Пользователь может видеть финансовую сводку по проекту: бюджет vs факт, план платежей, cash flow

- [ ] **S06: Интеграция с Invoice (оплаты счетов)** `risk:low` `depends:[S03,S04]`
  > After this: After this: При оплате счета создаётся Transaction и CashFlowPayment автоматически; Invoice.paidAt обновляется

- [ ] **S07: Финансовый дашборд** `risk:low` `depends:[S05,S06]`
  > After this: After this: Пользователь видит общий финансовый статус: total income/expense, budget health, upcoming payments, recent transactions

## Boundary Map

### S01 → S02, S03, S04

Produces:
- Category entity с иерархией (parentId), типом (income/expense), активностью (isActive)
- CategoryRepository: create, update, delete, findTree, findByType
- API: GET/PATCH/DELETE /api/categories/[id], GET/POST /api/categories
- UI: /finance/categories с list/detail pages

Consumes:
- nothing (baseline slice)

### S02 → S05, S07

Produces:
- Budget entity: projectId, categoryId, amount, period, note
- BudgetRepository: create, update, delete, findByProject, findByPeriod
- API: GET/PATCH/DELETE /api/budgets/[id], GET/POST /api/budgets
- UI: виджет на /projects/[id] для budget progress

Consumes:
- Category (S01) — categoryId relation
- Project (M004) — projectId relation, onDelete: Cascade

### S03 → S05, S06, S07

Produces:
- Transaction entity: date, amount, type (income/expense), source (manual/import), status (confirmed/pending), deletedAt (soft-delete)
- TransactionRepository: create, update, delete, softDelete, findWithFilters
- API: GET/PATCH/DELETE /api/transactions/[id], GET/POST /api/transactions
- UI: /finance/transactions с list/detail pages

Consumes:
- Category (S01) — categoryId relation
- Project (M004) — projectId relation (optional)
- Counterparty (M005/S01) — counterpartyId relation (optional)
- Invoice (M005/S04) — invoiceId relation (optional)

### S04 → S05, S06, S07

Produces:
- CashFlowPayment entity: date, amount, type, status (planned/scheduled/paid/cancelled), dueDate
- CashFlowPaymentRepository: create, update, updateStatus, findDuePayments
- API: GET/PATCH/DELETE /api/cashflow-payments/[id], GET/POST /api/cashflow-payments, PATCH /api/cashflow-payments/[id]/status
- UI: /finance/payments с list/detail pages

Consumes:
- Category (S01) — categoryId relation
- Project (M004) — projectId relation (optional)
- Counterparty (M005/S01) — counterpartyId relation (optional)
- Invoice (M005/S04) — invoiceId relation (optional)

### S05 → S07

Produces:
- Analytics API: GET /api/analytics/budget-vs-actual, GET /api/analytics/cashflow, GET /api/analytics/transactions-summary
- Budget vs actual comparison (budgeted amount vs transaction sum)
- Cash flow projection (upcoming planned + scheduled payments)

Consumes:
- Budget (S02) — для budget-vs-actual
- Transaction (S03) — для transaction summary
- CashFlowPayment (S04) — для cash flow projection

### S06 → S07

Produces:
- Invoice pay endpoint: POST /api/invoices/[id]/pay
- Auto-creation of Transaction (type=expense) and CashFlowPayment (status=paid)
- Invoice.paidAt update on payment

Consumes:
- Invoice (M005/S04) — invoiceId relation, paidAt update
- Transaction (S03) — создаёт запись при оплате
- CashFlowPayment (S04) — создаёт запись при оплате

### S07 (final assembly)

Produces:
- Finance dashboard: GET /api/finance/summary, UI /finance
- Aggregated widgets: total balance, income vs expense, budget health, upcoming payments

Consumes:
- Category (S01), Budget (S02), Transaction (S03), CashFlowPayment (S04), Analytics (S05), Invoice pay (S06)
