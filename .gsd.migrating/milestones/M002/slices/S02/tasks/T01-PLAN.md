---
estimated_steps: 18
estimated_files: 13
skills_used: []
---

# T01: Bootstrap Tailwind CSS v4 + shadcn/ui + lucide-react

## Why
The apps/web project has no frontend stack — no CSS, no component library, no layout shell. Before any CRM page can be built, Tailwind CSS v4, shadcn/ui, and lucide-react must be installed and configured. This unblocks all UI work in S02, S03, and S04.

## Do
1. Install dependencies: `npm install -D tailwindcss @tailwindcss/postcss postcss` and `npm install lucide-react class-variance-authority clsx tailwind-merge`
2. Create `postcss.config.mjs` with `@tailwindcss/postcss` plugin (Tailwind v4 uses PostCSS plugin, not standalone CLI)
3. Create `src/app/globals.css` with `@import "tailwindcss"` and shadcn/ui CSS variables (`@theme inline` block with --color-*, --radius, etc.)
4. Run `npx shadcn@latest init` with defaults: Tailwind v4, CSS variables, base color neutral, `@/` alias → `./src/*`
5. Run `npx shadcn@latest add table button input select badge card` to generate the components into `src/components/ui/`
6. Verify `src/lib/utils.ts` exists with `cn()` helper (shadcn init creates this; if not, create manually using clsx + tailwind-merge)
7. Delete old `src/lib/db.ts` (duplicate Prisma singleton — S01 created `src/lib/db/prisma.ts`). Update `src/app/api/health/route.ts` to import from `@/lib/db/prisma` instead of `@/lib/db` (the new export is `prisma` directly, not `getPrismaClient()`)

## Done when
- `npx tsc --noEmit` passes (all generated components compile without type errors)
- `src/components/ui/table.tsx`, `button.tsx`, `input.tsx`, `select.tsx`, `badge.tsx`, `card.tsx` exist
- `src/lib/utils.ts` exists with `cn()` export
- `src/app/globals.css` exists with Tailwind v4 `@import "tailwindcss"` directive and CSS variables
- `postcss.config.mjs` exists
- `components.json` exists at apps/web root
- Old `src/lib/db.ts` is deleted; health route imports from `@/lib/db/prisma`

## Inputs

- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/next.config.ts`
- `apps/web/src/lib/db/prisma.ts`
- `apps/web/src/app/api/health/route.ts`

## Expected Output

- `apps/web/postcss.config.mjs`
- `apps/web/components.json`
- `apps/web/src/app/globals.css`
- `apps/web/src/lib/utils.ts`
- `apps/web/src/components/ui/table.tsx`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/select.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/card.tsx`

## Verification

npx tsc --noEmit
