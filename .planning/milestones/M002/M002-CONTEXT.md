# M002 Context: CRM модуль

## Milestone Scope

M002 строит базовую CRM-функциональность:
- Управление контактами (физлица и юрлица)
- Источники лидов (LeadSource)
- Взаимодействия (Interaction)
- Лиды (Lead)

## Architecture Context

### Hybrid Backend (D006)
- **Next.js API Routes** — primary CRUD API for contacts/interactions
- **Python FastAPI worker** — background processing (не используется в M002, инфраструктура из M001 доступна)
- Shared PostgreSQL через Prisma (Next.js) и SQLAlchemy (Python)

### Tech Stack (D004)
- Next.js 16, React 19, TypeScript
- Prisma 6.6.0 (locked per MEM019)
- shadcn/ui for UI components
- SQLite for dev, PostgreSQL for production (MEM018)

### Data Model
CRM models already defined in `apps/web/prisma/schema.prisma`:
- `Contact` — unified (type=person|company)
- `LeadSource` — reference data
- `Interaction` — communications with contacts
- `Lead` — qualified contacts

See `docs/05-data-model.md` and `docs/06-module-crm.md` for full spec.

## Key Constraints

1. **apps/web is empty** — M01 delivered auth/shadcn/ui specification only, not implementation. Need to create Next.js App Router structure.
2. **Auth from M001** — NextAuth configured but not runtime-verified. Should test middleware before protecting CRM routes.
3. **Prisma migrations pending** — S01 must generate and apply migrations for CRM tables.
4. **SQLite for dev** — Use SQLite per MEM018. Schema compatible with PostgreSQL for production.

## Slice Decomposition

| Slice | Focus | Risk |
|-------|-------|------|
| S01 | Contact CRUD API | High — Prisma + API routes foundation |
| S02 | Contact List UI | Medium — depends on working API |
| S03 | Interactions API & UI | Medium — extends Contact model |
| S04 | Contact Detail & Integration | Low — integration slice |

## Dependencies

- M001 deliverables: Prisma schema, NextAuth setup, shadcn/ui config (spec)
- External: None (self-contained CRUD)

## Boundary Contracts

### S01 Outputs
- `apps/web/app/api/contacts/route.ts` — Contact list/create
- `apps/web/app/api/contacts/[id]/route.ts` — Contact read/update/delete
- `apps/web/lib/db/contacts.ts` — Prisma query wrapper

### S02-S04 Dependencies
- Consume Contact API from S01
- Extend with Interaction API (S03)
- Integrate in Contact Detail UI (S04)

## Verification Strategy

- Static: Files exist, Prisma validates
- Command: `npx prisma validate`, `npx prisma migrate status`, curl tests
- Behavioral: Browser renders UI, API responds
- Human: UAT of full flow

## Notes

- Duplicate detection (CRM-03) deferred to M003 (needs search infrastructure)
- Merge duplicates (CRM-04) deferred to M003
- Export to Excel (CRM-10) deferred to M007 (Analytics)
- Notifications (CRM-20) deferred to M008
