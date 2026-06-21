# S02: Contact List UI

**Goal:** Build the /crm/contacts page showing a filterable table of contacts using ContactApiClient (S01) and shadcn/ui Table. Bootstrap the full UI stack: Tailwind CSS v4, shadcn/ui components, lucide-react, root layout shell. Every contact row links to /crm/contacts/[id] (forward-compatible with S04).
**Demo:** After this: /crm/contacts показывает таблицу контактов с фильтрами, можно открыть карточку кликом

## Must-Haves

- User navigates to /crm/contacts, sees a table of contacts with type (person/company) and status filter dropdowns. Filtering re-fetches and updates the table. Each row links to /crm/contacts/[id]. Loading, empty, and error states are handled. `npx next build` succeeds without errors.

## Proof Level

- This slice proves: integration

## Integration Closure

Consumes ContactApiClient (S01) for data fetching at /api/contacts. Produces root layout, crm/contacts page, and shadcn/ui component library. S03 (Interactions API & UI) and S04 (Contact Detail & Integration) can now build UI on the same stack without re-bootstrapping.

## Verification

- Console errors on API fetch failures in ContactListPage. Empty/error/loading states for each async boundary. Next.js build-time error if page has broken imports or missing dependencies. Runtime API errors surfaced via toast or inline error message with retry.

## Tasks

- [ ] **T01: Bootstrap Tailwind CSS v4 + shadcn/ui + lucide-react** `est:1h`
  ## Why
  The apps/web project has no frontend stack — no CSS, no component library, no layout shell. Before any CRM page can be built, Tailwind CSS v4, shadcn/ui, and lucide-react must be installed and configured. This unblocks all UI work in S02, S03, and S04.
  - Files: `apps/web/package.json`, `apps/web/postcss.config.mjs`, `apps/web/components.json`, `apps/web/src/app/globals.css`, `apps/web/src/lib/utils.ts`, `apps/web/src/components/ui/table.tsx`, `apps/web/src/components/ui/button.tsx`, `apps/web/src/components/ui/input.tsx`, `apps/web/src/components/ui/select.tsx`, `apps/web/src/components/ui/badge.tsx`, `apps/web/src/components/ui/card.tsx`, `apps/web/src/lib/db.ts`, `apps/web/src/app/api/health/route.ts`
  - Verify: npx tsc --noEmit

- [ ] **T02: Create root layout + home page** `est:30m`
  ## Why
  Every Next.js app needs a root layout (HTML shell, metadata, CSS import) and a home page. Without these, no route renders. The layout provides the shared HTML structure that all pages render into.
  - Files: `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`
  - Verify: npx next build

- [ ] **T03: Build Contact List page with type and status filters** `est:1h`
  ## Why
  The slice goal is a functional contact list at `/crm/contacts` with filterable table. This is the primary deliverable. Consumes the ContactApiClient from S01 and shadcn/ui components from T01.
  - Files: `apps/web/src/app/crm/contacts/page.tsx`
  - Verify: npx next build

## Files Likely Touched

- apps/web/package.json
- apps/web/postcss.config.mjs
- apps/web/components.json
- apps/web/src/app/globals.css
- apps/web/src/lib/utils.ts
- apps/web/src/components/ui/table.tsx
- apps/web/src/components/ui/button.tsx
- apps/web/src/components/ui/input.tsx
- apps/web/src/components/ui/select.tsx
- apps/web/src/components/ui/badge.tsx
- apps/web/src/components/ui/card.tsx
- apps/web/src/lib/db.ts
- apps/web/src/app/api/health/route.ts
- apps/web/src/app/layout.tsx
- apps/web/src/app/page.tsx
- apps/web/src/app/crm/contacts/page.tsx
