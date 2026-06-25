---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T02: Create lib/db/prisma.ts and lib/db/contacts.ts

Создать singleton PrismaClient (lib/db/prisma.ts) и wrapper для Contact запросов (lib/db/contacts.ts). Реализовать: findMany, findUnique, create, update, softDelete (deletedAt).

## Inputs

- `apps/web/prisma/schema.prisma — Contact модель`

## Expected Output

- `lib/db/prisma.ts — PrismaClient singleton`
- `lib/db/contacts.ts — ContactRepository с методами CRUD`

## Verification

tsx --test lib/db/contacts.test.ts (тест создаёт контакт в dev.db)

## Observability Impact

Prisma логирование включено. Ошибки пробрасываются.
