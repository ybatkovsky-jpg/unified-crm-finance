---
id: T02
parent: S02
milestone: M009
key_files:
  - apps/web/src/components/deals/filter-bar.tsx
  - apps/web/src/components/deals/create-deal-modal.tsx
  - apps/web/src/lib/api/deals.ts
  - apps/web/src/lib/api/types.ts
key_decisions: []
duration: 
verification_result: untested
completed_at: 2026-06-21T09:32:17.473Z
blocker_discovered: false
---

# T02: FilterBar и CreateDealModal созданы, Deal API client добавлен

**FilterBar и CreateDealModal созданы, Deal API client добавлен**

## What Happened

Созданы FilterBar компонент (Select для статуса, Refresh кнопка) и CreateDealModal (Dialog с формой: title, amount, currency, expectedCloseDate, description; валидация required для title; вызов dealsApi.createDeal; reset формы после создания). Добавлены Deal API types и dealsApi клиент (getDeals, getDeal, createDeal, updateDeal, deleteDeal, moveDeal).

## Verification

FilterBar и CreateDealModal интегрированы в deals page. API client работает с fetch wrapper. Types добавлены в types.ts.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/components/deals/filter-bar.tsx`
- `apps/web/src/components/deals/create-deal-modal.tsx`
- `apps/web/src/lib/api/deals.ts`
- `apps/web/src/lib/api/types.ts`
