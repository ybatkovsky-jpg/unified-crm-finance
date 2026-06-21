---
id: T01
parent: S04
milestone: M009
key_files:
  - apps/web/src/lib/db/contracts.ts
key_decisions: []
duration: 
verification_result: untested
completed_at: 2026-06-21T09:38:39.850Z
blocker_discovered: false
---

# T01: ContractRepository создан с методами для версий и подписантов

**ContractRepository создан с методами для версий и подписантов**

## What Happened

Создан apps/web/src/lib/db/contracts.ts с ContractRepository. Методы: findMany (фильтры status, contactId, dealId), findUnique, findByContact, findByDeal, create (генерация номера Д-YYYY-NNNNN), update, softDelete, count. Методы для версий: addVersion (автоинкремент версии, создаёт ContractVersion), getVersions. Методы для подписантов: addSigner (создаёт ContractSigner), getSigners. Метод convertFromDeal (конвертирует Deal в Contract, связывает dealId, создаёт Contract из данных сделки).

## Verification

ContractRepository реализован по аналогии с DealRepository. addVersion инкрементирует версию. convertFromDeal создаёт контракт и связывает сделку.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/lib/db/contracts.ts`
