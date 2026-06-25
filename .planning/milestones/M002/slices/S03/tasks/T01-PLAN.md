---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T01: InteractionRepository data layer

Why: Interactions API needs a data access layer that mirrors the ContactRepository pattern from S01. The Interaction model requires manual UUID generation (no @default) and manual updatedAt (no @updatedAt), same as Contact.

Do:
1. Create InteractionRepository class in src/lib/db/interactions.ts with methods: findMany (filterable by contactId, ordered by createdAt desc), findUnique (by id), create (with randomUUID id, manual updatedAt), update, delete (hard delete — Interaction has no deletedAt field), count (with optional where). Follow ContactRepository pattern exactly — import prisma from ./prisma, use Prisma.UncheckedCreateInput types.
2. Write node:test tests in src/lib/db/interactions.test.ts: create interaction, find by id, find by contactId, update, delete, verify cascade on contact delete, count. Create a test User first (since authorId is required) and a test Contact for the interaction to reference. Use describe/it from node:test and assert from node:assert.

Done when: `npx tsx --test src/lib/db/interactions.test.ts` passes all tests (8+ tests expected).

## Inputs

- `apps/web/src/lib/db/prisma.ts`
- `apps/web/src/lib/db/contacts.ts`
- `apps/web/prisma/schema.prisma`

## Expected Output

- `apps/web/src/lib/db/interactions.ts`
- `apps/web/src/lib/db/interactions.test.ts`

## Verification

npx tsx --test src/lib/db/interactions.test.ts

## Observability Impact

Prisma query logging in dev mode (inherited from singleton); console.error not needed in repository — errors propagate to API layer
