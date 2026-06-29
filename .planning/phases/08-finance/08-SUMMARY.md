# Phase 8: Финансы — Summary

**Completed:** 2026-06-29
**Requirements delivered:** FIN-01, FIN-02, FIN-03, FIN-04, FIN-05, FIN-06 (6/6)

## What was done

### Schema (1 migration)
- New: `ProjectPayment` (1:N to Project) — paymentType, plannedPercent/Amount, receivedAmount, paymentMethod, transactionId→Transaction, status, dueDate
- `Transaction`: +paymentMethod (cash|bank|card), +paymentType (prepayment|final|other)
- Back-relations: Project.ProjectPayment[], Transaction.ProjectPayment

### New DB Repositories (4)
- `lib/db/project-payments.ts` — ProjectPaymentRepository (create/recordPayment/getCoverage/ensureDefaultStages)
- `lib/db/bank-statements.ts` — BankStatementRepository (importStatement/findById/list)
- `lib/db/debts.ts` — DebtsRepository (getSummary: receivables + payables + totals)

### Finance logic (2)
- `lib/finance/statement-parser.ts` — parseStatement (1C Client-Bank + plain-text fallback, направление по типу документа)
- `lib/finance/matching-engine.ts` — matchBankTransactions (ИНН/сумма, confidence 1.0/0.7/0.5, TransactionMatchingAudit), confirmMatch

### Extended DB Logic (2)
- `lib/db/designer-bonus.ts` — markPaid с guard (проверка всех денег клиента, 409 без override), getDesignerDebt, getDebtSummary
- `analytics/margin` route — декомпозиция расходов (materials/delivery/changeOrders/designerBonus), marginTarget, lowMarginAlerts

### New API Routes (9)
- `GET/POST /api/projects/[id]/payments`, `POST /api/project-payments/[id]/record`, `GET /api/projects/[id]/payments/coverage`
- `POST /api/finance/statements/import`, `GET /api/finance/statements`, `GET/DELETE /api/finance/statements/[id]`, `POST /api/finance/statements/[id]/match`
- `POST /api/finance/bank-transactions/[id]/confirm`
- `GET /api/finance/debts`, `GET /api/finance/designer-debt`

### Extended API Routes (2)
- `POST /api/transactions` — +paymentMethod, +paymentType
- `PATCH /api/designer-bonuses/[id]/mark-paid` — +overrideUnmet (guard)

### New API Client (1)
- `lib/api/project-payments.ts` — ProjectPaymentApiClient (getPayments/getCoverage/createPayment/recordPayment)

### New UI (3 pages + 1 component)
- `components/projects/project-payments-card.tsx` — этапы 70/30 + прогресс + диалог фиксации платежа
- `app/(app)/finance/statements/page.tsx` — загрузка 1C/TXT, список выписок, авто-сверка, ручное сопоставление
- `app/(app)/finance/debts/page.tsx` — таблицы дебиторки/кредиторки с просрочкой

### Updated UI (2)
- `analytics/margin/page.tsx` — блок «Низкомаржинальные проекты» с алертами
- `transaction-form.tsx` — Select «Способ оплаты» (cash/bank/card)
- `projects/[id]/page.tsx` — секция «Платежи клиента»
- `nav-config.ts` — +Банк-выписки, +Долги

## Key Design Decisions
1. **ProjectPayment отдельная модель** — плановые этапы 70/30 + фактические, связанные с Transaction.
2. **Парсер 1C без образца** — по стандарту Client-Bank + толерантный fallback; дорабатывается при получении реального файла.
3. **Matching по confidence** — high (≥0.7) авто, low → очередь UnresolvedTransaction для ручного разбора.
4. **Долги на лету** — без отдельной модели, агрегация из Transaction/Invoice/DesignerBonus.
5. **Бонус guard** — выплата блокируется (409) пока полученные деньги < contractAmount; есть override.
6. **Маржа — максимум ledger vs sources** — чтобы не задвоить (materials обычно уже в Transaction(expense)).

## Model Count
- Было: 67 → Стало: 68 (+ProjectPayment)
