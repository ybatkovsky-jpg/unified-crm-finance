# M002: CRM модуль

**Vision:** Построить базовую CRM-функциональность: управление контактами (физлица и юрлица), источниками лидов, взаимодействиями. Пользователи могут создавать, просматривать, редактировать контакты, фиксировать взаимодействия, видеть историю контакта. UI на Next.js с shadcn/ui, API через Next.js API Routes, данные в PostgreSQL через Prisma.

## Success Criteria

- Пользователь может создать контакт типа person (физлицо) с полями имя, телефон, email
- Пользователь может создать контакт типа company (юрлицо) с полями название, ИНН, телефон, email
- Список контактов отображается в таблице с фильтрами по типу и источнику
- Карточка контакта показывает все связанные взаимодействия в хронологическом порядке
- Пользователь может создать взаимодействие (звонок, встреча, email) и связать его с контактом
- Система проверяет дубликаты при создании контакта (по телефону, email, ИНН)
- Все операции проходят через Prisma с SQLite (dev) и совместимы с PostgreSQL (prod)

## Slices

- [x] **S01: S01** `risk:high` `depends:[]`
  > After this: After this: POST /api/contacts создаёт контакт в БД, GET /api/contacts возвращает JSON-массив, Prisma migrations применены

- [x] **S02: S02** `risk:medium` `depends:[]`
  > After this: After this: /crm/contacts показывает таблицу контактов с фильтрами, можно открыть карточку кликом

- [ ] **S03: S03** `risk:medium` `depends:[]`
  > After this: After this: POST /api/interactions создаёт взаимодействие, GET /api/contacts/[id]/interactions возвращает timeline

- [ ] **S04: Contact Detail & Integration** `risk:low` `depends:[S01,S02,S03]`
  > After this: After this: /crm/contacts/[id] показывает карточку контакта с обзором, interactions timeline, связанными сделками

## Boundary Map

### S01 → S02

Produces:
- `apps/web/app/api/contacts/route.ts` — Next.js API handlers for Contact CRUD
- `apps/web/app/api/contacts/[id]/route.ts` — Single contact GET/PUT/DELETE
- `apps/web/lib/db/contacts.ts` — Prisma queries wrapper
- `apps/web/lib/api/contacts.ts` — API client helpers

Consumes:
- `@prisma/client` — Prisma schema with Contact model (pre-existing)
- Session auth from M001 (NextAuth)

### S01 → S03

Produces:
- `apps/web/app/api/interactions/route.ts` — POST for creating interactions
- `apps/web/app/api/interactions/[id]/route.ts` — GET/PUT for single interaction
- `apps/web/lib/db/interactions.ts` — Prisma queries

Consumes:
- Contact API from S01 (interactions reference contactId)

### S01 → S02 (Continued)

Produces:
- `apps/web/app/crm/contacts/page.tsx` — Contact list UI with filters

Consumes:
- Contact API from S01

### S03 → S04

Produces:
- `apps/web/app/crm/contacts/[id]/page.tsx` — Contact detail with timeline

Consumes:
- Contact API from S01
- Interaction API from S03
