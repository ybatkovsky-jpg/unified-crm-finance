# Phase 7: Акт, закрытие проекта, гарантия — CONTEXT

**Date:** 2026-06-29
**Status:** Complete
**Scope:** PROJ-12 (акт приёмки), PROJ-13 (условия закрытия), PROJ-14 (гарантия)

<domain>
## Phase Boundary

Завершение жизненного цикла проекта — формальное подписание акта приёмки,
проверка условий закрытия и сохранение срока гарантии:
- **PROJ-12:** Акт подписывается монтажником на объекте (физлица) или менеджером (юрлица, ЭДО/бумага); тип подписанта определяется по типу контрагента.
- **PROJ-13:** Проект нельзя закрыть, пока не выполнены одновременно: акт подписан, все деньги клиента получены, все счета поставщикам оплачены, бонус дизайнеру выплачен. Решение заказчика: мягкий режим с override (предупреждения + подтверждение, не жёсткая блокировка).
- **PROJ-14:** Срок гарантии 2 года (+ фурнитура по гарантии производителя) хранится по проекту и виден на карточке.
</domain>

<decisions>
## Implementation Decisions

### PROJ-12: AcceptanceAct (1:1 к Project)
- Новая модель `AcceptanceAct`: status (draft|signed), signerType (individual|legal), signedById, signedAt, signMethod (paper|edo), actFileId, notes.
- Тип подписанта авто-выводится из `Contact.type`: company→legal (менеджер), иначе→individual (монтажник).
- Статус-машина: draft → signed (через `sign()`).
- Идемпотентное создание: POST на существующий акт возвращает существующий.

### PROJ-13: Closure readiness (мягкий с override)
- Метод `getClosureReadiness(projectId)` → чек-лист 4 условий с суммами/детализацией.
  1. Акт подписан: `AcceptanceAct.status === 'signed'`.
  2. Деньги клиента: `sum(Transaction type=income) >= Project.contractAmount`.
  3. Счета поставщиков: `count(Invoice paidAt=null) === 0`.
  4. Бонус дизайнеру: `DesignerBonus.status === 'paid'`.
- `completeWithCascade(...)` принимает `overrideUnmet`; при невыполненных условиях без override → `ConflictError` (409), иначе закрывает.
- UI: диалог закрытия показывает чек-лист; при невыполненных — две кнопки (Закрыть / Закрыть всё равно).

### PROJ-14: Гарантия на Project
- Скалярные поля: `warrantyStartDate`, `warrantyEndDate` (completedAt + 2 года), `warrantyNotes`.
- Проставляются автоматически в `completeWithCascade`.
- UI: карточка «Гарантия» в сайдбаре с бейджем «На гарантии»/«Истекла».

### Бонус дизайнера — минимальный след
- Новая модель `DesignerBonus` (1:1 к Project): designerId (→User), percent (default 0.1), amount, status (pending|paid), paidAt.
- Дефолт: 10% от суммы договора (CRM Phase 4); сумма авто-считается при upsert.
- Полная логика выплат и накопленного долга — FIN-06, Phase 8 (явно отложено).
</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Паттерн Repository → API route → API client → UI (как Installation/ChangeOrder из Phase 6).
- `completeWithCascade` (lib/db/projects.ts) — существующая точка закрытия, расширена readiness + warranty.
- `Contact.type` (company|person) — для авто-определения типа подписанта.
- `Transaction` (type=income) + `Invoice.paidAt` — для условий «деньги/счета» (аналитика уже агрегирует их).
- Decimal-расширение — авто number-конверсия во всех результатах (включая вложенные).
- `useMe()` hook — расширен полем `id` для подписи акта реальным пользователем.

### New Assets Created
- `AcceptanceAct` + `DesignerBonus` модели (миграция phase7_acceptance_closure_warranty).
- `lib/db/acceptance-act.ts`, `lib/db/designer-bonus.ts` — репозитории.
- `lib/api/acceptance-act.ts`, `lib/api/designer-bonus.ts` — API-клиенты.
- 6 API routes (acceptance-act collection/item/sign; designer-bonus collection/mark-paid; closure-readiness).
- `acceptance-act-card.tsx`, `designer-bonus-card.tsx` — UI-компоненты.
- Расширены: `projects.ts` (getClosureReadiness, completeWithCascade+override+warranty), `projects/[id]/page.tsx` (новые секции + переделанный диалог закрытия).
</code_context>
