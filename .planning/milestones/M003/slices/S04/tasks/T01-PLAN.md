---
estimated_steps: 9
estimated_files: 2
skills_used: []
---

# T01: Fix ContractRepository critical issues: transaction safety and import consistency

## Why
ConvertFromDeal creates a contract then updates the deal in two separate steps without transaction wrapping. If the deal update fails, an orphaned contract exists. Also, contracts/route.ts uses relative imports while other routes use @/ aliases.

## Do
1. Wrap convertFromDeal in prisma.$transaction() to ensure atomic bidirectional link creation (deal.contractId + contract.dealId)
2. Change import in apps/web/src/app/api/contracts/route.ts from '../../../lib/db/contracts' to '@/lib/db/contracts' for consistency

## Done when
- convertFromDeal uses prisma.$transaction() wrapping both create and deal update
- All contract API routes use '@/lib/db/contracts' import style
- Code compiles without errors

## Inputs

- `apps/web/src/lib/db/contracts.ts`
- `apps/web/src/app/api/contracts/route.ts`

## Expected Output

- `apps/web/src/lib/db/contracts.ts`
- `apps/web/src/app/api/contracts/route.ts`

## Verification

grep -q "prisma.\$transaction" apps/web/src/lib/db/contracts.ts && grep -q "from '@/lib/db/contracts'" apps/web/src/app/api/contracts/route.ts && echo '✅ T01 fixes verified'

## Observability Impact

No runtime observability changes — code fixes verified by grep pattern matching
