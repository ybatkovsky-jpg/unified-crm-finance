---
estimated_steps: 9
estimated_files: 1
skills_used: []
---

# T06: Add procurement navigation links to app layout

Why: Users need a way to reach /procurement/counterparties from the app. The current layout.tsx is minimal (just <body>{children}</body>). Add a simple top nav bar or sidebar with links to all modules including the new Procurement section.

Do:
1. Update `src/app/layout.tsx` to include a minimal navigation bar:
   - Simple horizontal nav or sidebar with links to existing modules (CRM/Contacts, Deals, Projects) and new Procurement → Counterparties
   - Highlight active route based on pathname (use client component for nav if needed)
   - Use shadcn/ui button or link styling
   - Link: 'Procurement' → /procurement/counterparties
   - Keep it simple — a top bar with key module links is sufficient for MVP

Done when: Navigation renders on all pages, clicking 'Procurement' navigates to /procurement/counterparties, TypeScript compiles.

## Inputs

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/crm/contacts/page.tsx`

## Expected Output

- `apps/web/src/app/layout.tsx`

## Verification

npx tsc --noEmit
