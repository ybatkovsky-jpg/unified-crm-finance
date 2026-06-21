---
estimated_steps: 1
estimated_files: 4
skills_used: []
---

# T02: Contract API routes

Создать API route handlers: apps/web/src/app/api/contracts/route.ts (GET list, POST create), apps/web/src/app/api/contracts/[id]/route.ts (GET one, PATCH update, DELETE soft delete), apps/web/src/app/api/contracts/[id]/versions/route.ts (GET list, POST create), apps/web/src/app/api/contracts/[id]/signers/route.ts (GET list, POST add).

## Inputs

- None specified.

## Expected Output

- `5 route.ts файлов с working handlers`
- `GET/POST /api/contracts`
- `GET/PATCH/DELETE /api/contracts/[id]`
- `GET/POST /api/contracts/[id]/versions`
- `GET/POST /api/contracts/[id]/signers`

## Verification

Тестирование curl командами
