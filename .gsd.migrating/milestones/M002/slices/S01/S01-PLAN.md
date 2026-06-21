# S01: Contact CRUD API

**Goal:** Создать базовый CRUD API для контактов через Next.js API Routes с Prisma. Применить Prisma миграции с CRM-таблицами.
**Demo:** After this: POST /api/contacts создаёт контакт в БД, GET /api/contacts возвращает JSON-массив, Prisma migrations применены

## Must-Haves

- POST /api/contacts создаёт Contact запись в БД (person или company)
- GET /api/contacts возвращает пагинированный список контактов
- GET /api/contacts/[id] возвращает один контакт или 404
- PUT /api/contacts/[id] обновляет контакт
- DELETE /api/contacts/[id] ставит deletedAt (soft delete)
- Prisma migrate dev применяет миграцию с CRM-таблицами
- npx prisma validate проходит

## Proof Level

- This slice proves: Command: npx prisma validate && npx prisma migrate status

## Integration Closure

API routes используют Prisma Client, подключаются к SQLite (dev). Auth middleware не требуется для MVP (можно добавить позже).

## Verification

- Prisma query logging включён в dev. API routes возвращают 500 на ошибке с логированием.

## Tasks

- [x] **T01: Prisma migrations for CRM models** `est:15m`
  Сгенерировать миграцию для CRM-моделей (Contact, LeadSource, Interaction, Lead) и применить её к dev-БД. Проверить что таблицы созданы через npx prisma studio или sqlite3.
  - Files: `apps/web/prisma/schema.prisma`, `apps/web/prisma/migrations/*`
  - Verify: npx prisma migrate status && npx prisma validate

- [x] **T02: Create lib/db/prisma.ts and lib/db/contacts.ts** `est:30m`
  Создать singleton PrismaClient (lib/db/prisma.ts) и wrapper для Contact запросов (lib/db/contacts.ts). Реализовать: findMany, findUnique, create, update, softDelete (deletedAt).
  - Files: `apps/web/lib/db/prisma.ts`, `apps/web/lib/db/contacts.ts`
  - Verify: tsx --test lib/db/contacts.test.ts (тест создаёт контакт в dev.db)

- [x] **T03: Create Contact API routes (Next.js)** `est:45m`
  Создать API routes для Contact CRUD:
  - app/api/contacts/route.ts (GET list, POST create)
  - app/api/contacts/[id]/route.ts (GET, PUT, DELETE)
  - Files: `apps/web/app/api/contacts/route.ts`, `apps/web/app/api/contacts/[id]/route.ts`
  - Verify: curl POST http://localhost:3000/api/contacts -d '{"type":"person","firstName":"Ivan","phone":"+79991234567"}' && curl GET http://localhost:3000/api/contacts

- [x] **T04: Create lib/api/contacts.ts client helpers** `est:20m`
  Создать TypeScript-клиент для Contact API (fetch wrapper). Функции: getContacts(filter, pagination), getContact(id), createContact(data), updateContact(id, data), deleteContact(id). Типы из Prisma.Contact.
  - Files: `apps/web/lib/api/contacts.ts`, `apps/web/lib/api/types.ts`
  - Verify: tsx --test lib/api/contacts.test.ts (mock fetch или к реальному API)

## Files Likely Touched

- apps/web/prisma/schema.prisma
- apps/web/prisma/migrations/*
- apps/web/lib/db/prisma.ts
- apps/web/lib/db/contacts.ts
- apps/web/app/api/contacts/route.ts
- apps/web/app/api/contacts/[id]/route.ts
- apps/web/lib/api/contacts.ts
- apps/web/lib/api/types.ts
