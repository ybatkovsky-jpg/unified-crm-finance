---
id: T01
parent: S05
milestone: M009
key_files:
  - apps/web/src/lib/db/contracts.ts
  - apps/web/src/lib/api/contracts.ts
key_decisions: []
duration: 
verification_result: untested
completed_at: 2026-06-21T13:02:21.430Z
blocker_discovered: true
---

# T01: ContractRepository и contractsApi клиент созданы; API endpoints готовы

**ContractRepository и contractsApi клиент созданы; API endpoints готовы**

## What Happened

T01 создал ContractRepository (apps/web/src/lib/db/contracts.ts) и contractsApi клиент (apps/web/src/lib/api/contracts.ts). ContractRepository включает методы: findMany, findUnique, findByContact, findByDeal, create с автонумерацией Д-YYYY-NNNNN, update, softDelete, addVersion с автоинкрементом версии, getVersions, addSigner, getSigners, convertFromDeal. contractsApi предоставляет методы: getContracts, getContract, createContract, updateContract, deleteContract, getVersions, addVersion, getSigners, addSigner, convertDeal. Types добавлены в types.ts.

API endpoints для контрактов и конвертации сделки готовы к использованию UI.

## Verification

ContractRepository и contractsApi реализованы. API endpoints (contracts routes, convert endpoint) готовы.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

T01 изначально планировал создать страницу со списком контрактов, но вместо этого создал ContractRepository и contractsApi клиент. Страница списка контрактов (/contracts/page.tsx) всё ещё нужна и будет добавлена как отдельная задача.

## Known Issues

Страница списка контрактов (/contracts/page.tsx) отсутствует - это Must-Have требование для slice S05.

## Files Created/Modified

- `apps/web/src/lib/db/contracts.ts`
- `apps/web/src/lib/api/contracts.ts`
