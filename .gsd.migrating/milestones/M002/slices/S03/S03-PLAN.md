# S03: Interactions API & UI

**Goal:** POST /api/interactions creates interaction; GET /api/contacts/[id]/interactions returns timeline
**Demo:** After this: POST /api/interactions создаёт взаимодействие, GET /api/contacts/[id]/interactions возвращает timeline

## Must-Haves

- `npx tsx --test src/lib/db/interactions.test.ts` — Repository tests pass with real SQLite
- `npx tsx --test src/lib/api/interactions.test.ts` — API client tests pass
- `npx next build` — project builds with zero TypeScript errors
- `curl -X POST /api/interactions` → 201 with valid interaction JSON
- `curl GET /api/contacts/{id}/interactions` → 200 with chronological array
- `npx next dev` → /crm/contacts/{id} page can render interaction timeline
- All 6 S01 API routes still functional (no regression from new route files)

## Proof Level

- This slice proves: integration

## Integration Closure

- **Upstream consumed**: ContactRepository from S01 (findUnique validates contactId), PrismaClient singleton from src/lib/db/prisma.ts, API route conventions from S01
- **New wiring**: 3 route files register with Next.js App Router; InteractionRepository wraps Prisma; InteractionApiClient wraps fetch
- **Remaining before milestone usable**: S04 Contact Detail page embeds InteractionForm + InteractionTimeline into /crm/contacts/[id]; auth middleware wiring (M001)

## Verification

- console.error on all API route error paths (same pattern as S01)
- console.error on API client fetch failures (same pattern as ContactApiClient)
- Prisma query logging in dev mode (inherited from singleton)
- UI error state with retry in timeline component

## Tasks

- [x] **T01: InteractionRepository data layer** `est:30m`
  Why: Interactions API needs a data access layer that mirrors the ContactRepository pattern from S01. The Interaction model requires manual UUID generation (no @default) and manual updatedAt (no @updatedAt), same as Contact.
  - Files: `apps/web/src/lib/db/interactions.ts`, `apps/web/src/lib/db/interactions.test.ts`
  - Verify: npx tsx --test src/lib/db/interactions.test.ts

- [ ] **T02: Interaction API routes** `est:30m`
  Why: Expose interaction CRUD as Next.js App Router API endpoints following the exact same pattern as S01's contact routes. Three route files: collection, single-resource, and nested contact timeline.
  - Files: `apps/web/src/app/api/interactions/route.ts`, `apps/web/src/app/api/interactions/[id]/route.ts`, `apps/web/src/app/api/contacts/[id]/interactions/route.ts`
  - Verify: npx next build

- [ ] **T03: Interaction API client + types** `est:25m`
  Why: Frontend needs a typed API client for interactions like the ContactApiClient from S01. Types must be added to the shared types.ts for InteractionData, create/update inputs.
  - Files: `apps/web/src/lib/api/interactions.ts`, `apps/web/src/lib/api/interactions.test.ts`, `apps/web/src/lib/api/types.ts`
  - Verify: npx tsx --test src/lib/api/interactions.test.ts

- [ ] **T04: Interaction UI components** `est:25m`
  Why: S04 Contact Detail page will embed interaction form and timeline. S03 must build these reusable components now. Depends on shadcn/ui Dialog and Textarea (not yet installed).
  - Files: `apps/web/src/components/crm/interaction-form.tsx`, `apps/web/src/components/crm/interaction-timeline.tsx`, `apps/web/src/components/ui/dialog.tsx`, `apps/web/src/components/ui/textarea.tsx`
  - Verify: npx next build

## Files Likely Touched

- apps/web/src/lib/db/interactions.ts
- apps/web/src/lib/db/interactions.test.ts
- apps/web/src/app/api/interactions/route.ts
- apps/web/src/app/api/interactions/[id]/route.ts
- apps/web/src/app/api/contacts/[id]/interactions/route.ts
- apps/web/src/lib/api/interactions.ts
- apps/web/src/lib/api/interactions.test.ts
- apps/web/src/lib/api/types.ts
- apps/web/src/components/crm/interaction-form.tsx
- apps/web/src/components/crm/interaction-timeline.tsx
- apps/web/src/components/ui/dialog.tsx
- apps/web/src/components/ui/textarea.tsx
