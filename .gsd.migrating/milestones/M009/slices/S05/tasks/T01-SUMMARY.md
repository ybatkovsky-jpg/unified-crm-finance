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
completed_at: 2026-06-21T09:40:11.718Z
blocker_discovered: false
---

# T01: ContractRepository и contractsApi клиент созданы, Contract types добавлены

**ContractRepository и contractsApi клиент созданы, Contract types добавлены**

## What Happened

Создан ContractRepository и contractsApi клиент. ContractRepository: findMany, findUnique, findByContact, findByDeal, create (автонумерация Д-YYYY-NNNNN), update, softDelete, addVersion (автоинкремент версии), getVersions, addSigner, getSigners, convertFromDeal. contractsApi: getContracts, getContract, createContract, updateContract, deleteContract, getVersions, addVersion, getSigners, addSigner, convertDeal. Types добавлены в types.ts: ContractData, ContractVersionData, ContractSignerData, ContractCreateInput, ContractUpdateInput, ContractVersionCreateInput, ContractSignerCreateInput, DealConvertInput.

## Verification

ContractRepository и contractsApi реализованы. API endpoints (contracts routes, convert endpoint) готовы.

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
- `apps/web/src/lib/api/contracts.ts`
