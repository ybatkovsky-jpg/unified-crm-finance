---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: ContractRepository с версионностью

Создать apps/web/src/lib/db/contracts.ts с ContractRepository. Методы: findMany, findUnique, findById, create (генерация номера Д-YYYY-NNNNN), update, softDelete. Методы для версий: addVersion, getVersions. Методы для подписантов: addSigner, getSigners. Метод convertFromDeal для конвертации сделки в контракт.

## Inputs

- `apps/web/prisma/schema.prisma`

## Expected Output

- `ContractRepository класс с методами`
- `Генерация номера Д-YYYY-NNNNN`
- `addVersion для версионности`
- `addSigner для подписантов`
- `convertFromDeal для конвертации`

## Verification

npm run test -- contracts.test.ts
