---
id: T03
parent: S04
milestone: M009
key_files:
  - apps/web/src/app/api/deals/[id]/convert/route.ts
key_decisions: []
duration: 
verification_result: untested
completed_at: 2026-06-21T09:38:53.488Z
blocker_discovered: false
---

# T03: Convert endpoint создаёт контракт из сделки с автоматической связкой

**Convert endpoint создаёт контракт из сделки с автоматической связкой**

## What Happened

Создан POST /api/deals/[id]/convert endpoint для конвертации сделки в контракт. Проверяет существование сделки, проверяет что контракт ещё не создан, вызывает contracts.convertFromDeal с данными из body (title, amount, currency, startDate, endDate, notes). Возвращает созданный contract и обновлённый deal с contractId.

## Verification

Endpoint проверяет существование сделки, отсутствие контракта, создаёт контракт через convertFromDeal, обновляет deal.contractId.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/deals/[id]/convert/route.ts`
