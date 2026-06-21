---
id: T02
parent: S04
milestone: M009
key_files:
  - apps/web/src/app/api/contracts/route.ts
  - apps/web/src/app/api/contracts/[id]/route.ts
  - apps/web/src/app/api/contracts/[id]/versions/route.ts
  - apps/web/src/app/api/contracts/[id]/signers/route.ts
key_decisions: []
duration: 
verification_result: untested
completed_at: 2026-06-21T09:38:47.027Z
blocker_discovered: false
---

# T02: Contract API endpoints созданы: list, get, update, delete, versions, signers

**Contract API endpoints созданы: list, get, update, delete, versions, signers**

## What Happened

Созданы API route handlers: contracts/route.ts (GET list с фильтрами status/contactId/dealId, POST create с валидацией title, contactId), contracts/[id]/route.ts (GET one with include versions/signers/deal/contact/template, PATCH update, DELETE soft delete), contracts/[id]/versions/route.ts (GET list versions, POST addVersion с валидацией contentMd, createdBy), contracts/[id]/signers/route.ts (GET list signers, POST addSigner с валидацией name).

## Verification

API endpoints созданы по аналогии с deals. GET возвращает contract с include всех relations. POST для create/version/signer с валидацией.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/app/api/contracts/route.ts`
- `apps/web/src/app/api/contracts/[id]/route.ts`
- `apps/web/src/app/api/contracts/[id]/versions/route.ts`
- `apps/web/src/app/api/contracts/[id]/signers/route.ts`
