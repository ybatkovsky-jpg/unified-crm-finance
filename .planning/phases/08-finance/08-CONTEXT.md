# Phase 8: Финансы — CONTEXT

**Date:** 2026-06-29
**Status:** Complete
**Scope:** FIN-01 (платежи 70/30), FIN-02 (импорт банк-выписки), FIN-03 (наличные), FIN-04 (маржа), FIN-05 (долги), FIN-06 (бонус дизайнера)

<domain>
## Phase Boundary

Полный финансовый модуль: от учёта клиентских платежей и импорта выписок до маржи, долгов и выплат:
- **FIN-01:** Платежи клиента (предоплата 70% + финал 30% перед монтажом), привязанные к проекту.
- **FIN-02:** Импорт банк-выписки файлом 1C/TXT (Озон, Тинькофф) → парсинг + авто/ручная сверка с проектами/счетами.
- **FIN-03:** Наличные платежи вносятся вручную; способ оплаты (cash/bank/card) фиксируется.
- **FIN-04:** Маржа проекта = доходы − расходы (материалы, доставка, бонус, доп. работы) с пороговым алертом.
- **FIN-05:** Долги: дебиторка (клиенты) и кредиторка (поставщики/производства/дизайнер) с просрочкой.
- **FIN-06:** Бонус дизайнеру выплачивается разово после всех денег клиента; виден накопленный долг дизайнера.

Решения заказчика: FIN-01 — отдельная модель ProjectPayment; FIN-02 — полностью сейчас (несмотря на отсутствие образца файла).
</domain>

<decisions>
## Implementation Decisions

### FIN-01: ProjectPayment (отдельная модель 1:N к Project)
- Поля: paymentType (prepayment|final|other), plannedPercent/receivedAmount, paymentMethod, transactionId (→Transaction), status (planned|partial|paid), dueDate.
- Авто-создание 2 этапов (70/30) при первом GET (ensureDefaultStages, idempotent).
- recordPayment: создаёт Transaction(income, paymentMethod, paymentType) + обновляет этап.
- getCoverage: { total, received, percent, prepaymentMet, fullyPaid }.

### FIN-03: paymentMethod на Transaction
- +paymentMethod (cash|bank|card), +paymentType (prepayment|final|other).
- Расширены TransactionCreateInput/Data, POST route, transaction-form (Select «Способ оплаты»).

### FIN-02: Импорт банк-выписки
- Датаслой уже мигрирован (BankStatement/BankTransaction/TransactionMatchingAudit/UnresolvedTransaction).
- `statement-parser.ts`: парсер 1C Client-Bank (секции, направление по типу документа) + толерантный plain-text fallback.
- `bank-statements.ts` репозиторий: importStatement (создаёт BankStatement + BankTransaction[]).
- `matching-engine.ts`: авто-сверка по ИНН→контрагент→счёт(сумма±1%), confidence (1.0/0.7/0.5), TransactionMatchingAudit, очередь UnresolvedTransaction.
- confirmMatch: ручное подтверждение → Transaction(income, source=import, externalId=bankTxId), дедупликация.

### FIN-04: Маржа + threshold
- Расширен margin route: декомпозиция расходов (materials=Invoice paid, delivery, changeOrders, designerBonus paid), select marginTarget, lowMargin flag + lowMarginAlerts в response.

### FIN-05: Долги (вычисляются на лету)
- `debts.ts`: receivables (contractAmount − income per project), payables (Invoice unpaid + DesignerBonus pending), overdue по dueDate/endDate.
- Без отдельной модели — агрегация из существующих данных.

### FIN-06: Бонус дизайнера (guard + долг)
- markPaid с guard: проверка received >= contractAmount (409 ConflictError без override).
- getDesignerDebt(designerId), getDebtSummary() — GROUP BY designerId WHERE pending.
- mark-paid route принимает overrideUnmet.
</decisions>

<code_context>
## Reusable / Existing Assets
- Паттерн Repository → API route → API client → UI (как Phase 6/7).
- Transaction model (type=income/expense) — основа платежей.
- BankStatement/BankTransaction модели — уже мигрированы (init_postgres).
- analytics/margin route — расширен, не переписан.
- decimal-extension — авто number-конверсия.

## New Assets
- ProjectPayment модель, `lib/db/project-payments.ts`, `lib/api/project-payments.ts`, 3 API routes, `project-payments-card.tsx`.
- `lib/finance/statement-parser.ts`, `lib/finance/matching-engine.ts`, `lib/db/bank-statements.ts`, 5 API routes, `/finance/statements/page.tsx`.
- `lib/db/debts.ts`, `/api/finance/debts`, `/finance/debts/page.tsx`.
- Расширены: `analytics/margin` (декомпозиция+alerts), `designer-bonus.ts` (guard+debt), margin page (low-margin блок), nav-config (+Банк-выписки, +Долги).
</code_context>
