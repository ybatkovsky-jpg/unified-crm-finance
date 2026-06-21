---
estimated_steps: 7
estimated_files: 3
skills_used: []
---

# T02: Interaction API routes

Why: Expose interaction CRUD as Next.js App Router API endpoints following the exact same pattern as S01's contact routes. Three route files: collection, single-resource, and nested contact timeline.

Do:
1. Create src/app/api/interactions/route.ts — GET (list interactions with optional contactId filter, ordered by createdAt desc) + POST (create with validation: contactId required, type required and must be one of call|meeting|email|note|task, authorId required, content required for non-note types). POST must verify contactId exists via ContactRepository before creating. Return 201 with {data: interaction}.
2. Create src/app/api/interactions/[id]/route.ts — GET single interaction, PUT update, DELETE hard delete. All handlers await params (Next.js 16 pattern: params is Promise<{id}>). Return 404 if not found.
3. Create src/app/api/contacts/[id]/interactions/route.ts — GET timeline: findMany by contactId, ordered by createdAt desc, include author User.name for display. Return {data: interactions}. Verify contact exists first, return 404 if not.
4. All routes follow S01 pattern: try/catch with console.error, structured {error, message} responses, NextRequest/NextResponse types.

Done when: `npx next build` succeeds (routes compile and register); curl POST /api/interactions returns 201; curl GET /api/contacts/{id}/interactions returns chronological array.

## Inputs

- `apps/web/src/lib/db/interactions.ts`
- `apps/web/src/lib/db/contacts.ts`
- `apps/web/src/app/api/contacts/route.ts`
- `apps/web/src/app/api/contacts/[id]/route.ts`

## Expected Output

- `apps/web/src/app/api/interactions/route.ts`
- `apps/web/src/app/api/interactions/[id]/route.ts`
- `apps/web/src/app/api/contacts/[id]/interactions/route.ts`

## Verification

npx next build

## Observability Impact

console.error on all API route error paths; structured error responses with error/message properties
