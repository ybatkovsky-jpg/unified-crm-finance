---
estimated_steps: 8
estimated_files: 2
skills_used: []
---

# T02: Create root layout + home page

## Why
Every Next.js app needs a root layout (HTML shell, metadata, CSS import) and a home page. Without these, no route renders. The layout provides the shared HTML structure that all pages render into.

## Do
1. Create `src/app/layout.tsx` — server component with `<html lang="ru">`, `<body className="antialiased">`, metadata export (title: "Unified CRM"), `import './globals.css'`, and `{children}` render
2. Create `src/app/page.tsx` — server component that redirects to `/crm/contacts` using `redirect()` from `next/navigation`

## Done when
- `npx next build` succeeds (validates layout, page, CSS, and all imports resolve)
- `npx next dev` starts without errors and `/` resolves (redirects to /crm/contacts)

## Inputs

- `apps/web/src/app/globals.css`
- `apps/web/src/lib/utils.ts`
- `apps/web/package.json`
- `apps/web/next.config.ts`
- `apps/web/tsconfig.json`

## Expected Output

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`

## Verification

npx next build
