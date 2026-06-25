# S04: Contact Detail & Integration

**Goal:** Create /crm/contacts/[id] page that displays contact details header with read-only fields and interactions timeline with add interaction form, integrating S01 Contact API and S03 Interaction API & UI components.
**Demo:** After this: /crm/contacts/[id] показывает карточку контакта с обзором, interactions timeline, связанными сделками

## Must-Haves

- Complete the planned slice outcomes.

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [x] **T01: Contact Detail Page with Interactions** `est:30min`
  ## Why
  Build the integration slice that brings together Contact and Interaction APIs into a unified contact detail view, proving the S01-S03 data layer works end-to-end for users.
  - Files: `apps/web/src/app/crm/contacts/[id]/page.tsx`
  - Verify: cd apps/web && npx next build (exit 0, route registered)

## Files Likely Touched

- apps/web/src/app/crm/contacts/[id]/page.tsx
