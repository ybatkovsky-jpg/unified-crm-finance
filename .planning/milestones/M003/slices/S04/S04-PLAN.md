# S04: Contract Repository, API, and Deal Conversion

**Goal:** Contract Repository, API, and Deal Conversion — Fix critical issues in ContractRepository (transaction safety, import consistency), add comprehensive unit tests for ContractRepository (14 methods) and ContractApiClient (11 methods) using node:test pattern established in S01/M002
**Demo:** POST /api/deals/[id]/convert создаёт Contract из Deal, устанавливает bidirectional link; ContractRepository.addVersion инкрементирует номер версии; ContractRepository.addSigner добавляет подписанта

## Must-Haves

- ContractRepository.convertFromDeal wrapped in prisma.$transaction() for atomic bidirectional link creation\n- All contract API routes use consistent @/lib/db/contracts import style\n- ContractRepository tests pass: cd apps/web && npx tsx --test src/lib/db/contracts.test.ts (0 failures)\n- ContractApiClient tests pass: cd apps/web && npx tsx --test src/lib/api/contracts.test.ts (0 failures)\n- All 14 repository methods covered: findMany, findUnique, findByContact, findByDeal, create, update, softDelete, count, addVersion, getVersions, addSigner, getSigners, convertFromDeal\n- All 11 client methods covered: getContracts, getContract, createContract, updateContract, deleteContract, getVersions, addVersion, getSigners, addSigner, convertDeal

## Proof Level

- This slice proves: contract

## Integration Closure

- ContractRepository wraps convertFromDeal in transaction for atomic bidirectional link creation (deal.contractId + contract.dealId)\n- ContractApiClient follows established pattern with mockable fetch and typed methods\n- Test coverage mirrors S01 pattern: repository tests use real Prisma, client tests use mocked fetch\n- API routes (/api/contracts/*, /api/deals/[id]/convert) ready for S05 contract pages

## Verification

- Test assertion errors provide descriptive failure messages for debugging\n- No runtime observability changes in this slice (test coverage only)

## Tasks

- [x] **T01: Fix ContractRepository critical issues: transaction safety and import consistency** `est:30m`
  ## Why
  ConvertFromDeal creates a contract then updates the deal in two separate steps without transaction wrapping. If the deal update fails, an orphaned contract exists. Also, contracts/route.ts uses relative imports while other routes use @/ aliases.
  - Files: `apps/web/src/lib/db/contracts.ts`, `apps/web/src/app/api/contracts/route.ts`
  - Verify: grep -q "prisma.\$transaction" apps/web/src/lib/db/contracts.ts && grep -q "from '@/lib/db/contracts'" apps/web/src/app/api/contracts/route.ts && echo '✅ T01 fixes verified'

- [x] **T02: Add ContractRepository unit tests (14 methods)** `est:1h`
  ## Why
  ContractRepository has zero test coverage. Following S01/M002 pattern, comprehensive unit tests verify each method works correctly with real Prisma.
  - Files: `apps/web/src/lib/db/contracts.test.ts`
  - Verify: cd apps/web && npx tsx --test src/lib/db/contracts.test.ts

- [x] **T03: Add ContractApiClient unit tests (11 methods)** `est:45m`
  ## Why
  ContractApiClient has zero test coverage. Following S01/M002 pattern, unit tests with mocked fetch verify correct HTTP requests, URLs, methods, and error handling.
  - Files: `apps/web/src/lib/api/contracts.test.ts`
  - Verify: cd apps/web && npx tsx --test src/lib/api/contracts.test.ts

## Files Likely Touched

- apps/web/src/lib/db/contracts.ts
- apps/web/src/app/api/contracts/route.ts
- apps/web/src/lib/db/contracts.test.ts
- apps/web/src/lib/api/contracts.test.ts
