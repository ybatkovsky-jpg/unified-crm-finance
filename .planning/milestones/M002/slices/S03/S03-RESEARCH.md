# S03: Interactions API & UI — Research

**Date:** 2026-06-21

## Summary

S03 builds the Interactions API layer and UI — creating and viewing communications (calls, meetings, emails) linked to contacts.
The Interaction model already exists in the Prisma schema with fields: `id`, `contactId`, `type`, `direction`, `subject`, `content`, `scheduledAt`, `completedAt`, `authorId`, `eventId`, `createdAt`, `updatedAt`.
The pattern from S01 (Repository → API routes → API client) is well-established and can be directly replicated.
For the UI side, S03 must provide reusable components (create-interaction form, timeline display) that S04 will embed into the contact detail page.
Like S02, S03 depends on shadcn/ui being available — but it can start API work in parallel with S02's UI bootstrap.

## Recommendation

**Build the API layer first (following S01 patterns), then the UI components.** The API layer is independent of the UI bootstrap:
1. Create `InteractionRepository` in `src/lib/db/interactions.ts` — mirroring ContactRepository pattern
2. Create API routes: `POST /api/interactions`, `GET /api/interactions/[id]`, `PUT /api/interactions/[id]`
3. Create nested route: `GET /api/contacts/[id]/interactions` — returns timeline for a contact
4. Create `InteractionApiClient` in `src/lib/api/interactions.ts` — mirroring ContactApiClient
5. Create UI components: `InteractionForm` (create dialog), `InteractionTimeline` (chronological list)

The API work can start immediately. The UI work depends on shadcn/ui being bootstrapped (S02's T01 or a shared prerequisite task).

## Implementation Landscape

### Key Files

**New files to create:**

- `apps/web/src/lib/db/interactions.ts` — InteractionRepository class (mirrors ContactRepository pattern from `src/lib/db/contacts.ts`)
- `apps/web/src/lib/db/interactions.test.ts` — Repository tests (mirrors `contacts.test.ts`)
- `apps/web/src/app/api/interactions/route.ts` — POST (create interaction) + GET (list interactions)
- `apps/web/src/app/api/interactions/[id]/route.ts` — GET/PUT/DELETE single interaction
- `apps/web/src/app/api/contacts/[id]/interactions/route.ts` — GET interactions for a specific contact (timeline)
- `apps/web/src/lib/api/interactions.ts` — InteractionApiClient class (mirrors ContactApiClient)
- `apps/web/src/lib/api/interactions.test.ts` — API client tests
- `apps/web/src/components/crm/interaction-form.tsx` — Create/edit interaction form component
- `apps/web/src/components/crm/interaction-timeline.tsx` — Chronological interaction list component

**Existing files to reference:**

- `apps/web/prisma/schema.prisma` — Interaction model at lines 554-575: id, contactId, type (String), direction?, subject?, content?, scheduledAt?, completedAt?, authorId (required), eventId?, createdAt, updatedAt. Relations: Contact (cascade delete), User (authorId), Event (optional 1:1), FileEntity[].
- `apps/web/src/lib/db/contacts.ts` — Repository pattern: class with findMany, findUnique, create, update, softDelete, count methods. Uses `prisma` singleton from `./prisma`.
- `apps/web/src/lib/db/prisma.ts` — PrismaClient singleton (use this, not the old `src/lib/db.ts`)
- `apps/web/src/app/api/contacts/route.ts` — API route pattern: GET/POST handlers with validation, error handling
- `apps/web/src/lib/api/contacts.ts` — API client pattern: class with typed methods, ApiClientError, singleton export, convenience exports

### Build Order

1. **InteractionRepository** (`src/lib/db/interactions.ts`) — Create with methods: findMany (with contactId filter, ordering by createdAt desc), findUnique, create (with randomUUID, manual updatedAt), update. No soft-delete for interactions (keep it simple — interactions are immutable records). ~15 min, mirrors contacts.ts.
2. **InteractionRepository tests** — Write node:test tests via tsx --test. Test create, findByContactId, findUnique. ~10 min.
3. **API routes** — Three route files:
   - `api/interactions/route.ts` — POST (create with validation: contactId required, type required, authorId required), GET (list with optional filters)
   - `api/interactions/[id]/route.ts` — GET single, PUT update, DELETE (hard delete? soft delete? — soft-delete preferred for audit)
   - `api/contacts/[id]/interactions/route.ts` — GET timeline (findMany by contactId, ordered by createdAt desc, include author User.name)
4. **API client** (`src/lib/api/interactions.ts`) — InteractionApiClient with createInteraction, getInteraction, updateInteraction, deleteInteraction, getContactInteractions. Mirror ContactApiClient pattern exactly.
5. **API client tests** — Mocked fetch tests.
6. **UI components** (depends on shadcn/ui bootstrap from S02 T01):
   - `InteractionForm` — Dialog/modal with fields: type (select: call/meeting/email), direction (select: inbound/outbound), subject, content (textarea), scheduledAt (date input), completedAt (date input). Uses shadcn/ui Dialog, Select, Input, Textarea, Button.
   - `InteractionTimeline` — Chronological list showing each interaction with type badge, date, author, subject, content preview. Uses shadcn/ui Card, Badge.

### Verification Approach

- **Static**: `npx tsc --noEmit` passes; all files exist
- **API tests**: `npx tsx --test src/lib/db/interactions.test.ts` passes; `npx tsx --test src/lib/api/interactions.test.ts` passes
- **API curl tests**: POST /api/interactions → 201; GET /api/contacts/[id]/interactions → returns array; GET /api/interactions/[id] → 200; PUT update → 200; DELETE → 200
- **UI**: `npx next dev` → navigate to a contact → timeline renders; create interaction form opens, submits, and closes
- **Integration**: Verify created interaction appears in GET /api/contacts/[id]/interactions response

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Date formatting in timeline | `Intl.DateTimeFormat` or `date-fns` (if already installed) | Avoid manual date string manipulation |
| Icon for interaction types (call/meeting/email) | lucide-react (Phone, Calendar, Mail icons) | Already needed for shadcn/ui; consistent icon set |

## Constraints

- **authorId is required** — The Interaction model requires `authorId` (User relation). Without auth middleware, use a hardcoded or "system" user ID for MVP, or make authorId optional in a schema migration. This is a blocker to address early.
- **No auth middleware** — API routes are public, so any request can create interactions. Acceptable for MVP.
- **contactId must be a valid UUID** — API must validate that the referenced contact exists before creating the interaction.
- **Interaction.type is a free-form String in schema** — no Prisma enum. Keep it flexible but validate common values (call, meeting, email, note, task) in API validation.
- **shadcn/ui dependency** — UI components require S02's bootstrap task. API work is unblocked.

## Common Pitfalls

- **authorId requirement** — The Interaction schema requires a User relation. Either add a default system user seed, make authorId optional via migration, or pass a known user ID in tests. Don't skip this validation — it will cause Prisma foreign key errors.
- **Nested route structure** — `api/contacts/[id]/interactions/route.ts` is a nested dynamic route. The route handler receives both `params.id` (contact ID) from the parent segment. Follow Next.js App Router conventions carefully.
- **Cascade delete** — Contact has `onDelete: Cascade` on Interaction. Deleting a contact deletes ALL its interactions. This is acceptable for MVP but may surprise users. Note in docs.
- **Don't duplicate the old db.ts** — There's an old `src/lib/db.ts` that also exports a PrismaClient. Always import from `src/lib/db/prisma.ts` (S01's singleton). The old file should be cleaned up separately.
- **eventId nullable** — Interactions can optionally link to a calendar Event. Don't require it; the field exists for future Google Calendar sync integration.

## Open Risks

- **authorId requirement** — needs resolution before creating interactions. Options: (a) schema migration to make authorId optional, (b) seed a "system" user, (c) hardcode a test user ID. Choose option (a) for cleanest MVP path.
- **Nested route interaction with parent** — GET /api/contacts/[id]/interactions must NOT be handled by the contacts/[id] route.ts. Next.js App Router should route correctly because `interactions/route.ts` is a separate segment, but verify with a test.
- **UI component availability** — The InteractionForm and InteractionTimeline depend on S02's shadcn/ui bootstrap. If S02's bootstrap task changes (e.g., different components installed), S03 UI tasks must adapt.