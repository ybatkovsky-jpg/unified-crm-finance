---
estimated_steps: 7
estimated_files: 4
skills_used: []
---

# T01: Install and configure Tailwind CSS

Tailwind CSS is the foundation for shadcn/ui components and all UI styling. This task installs Tailwind v3 (stable, well-documented) and configures it to work with Next.js 16 App Router.

## Steps

1. Install Tailwind CSS dependencies: `pnpm add -D tailwindcss postcss autoprefixer`
2. Create `apps/web/tailwind.config.ts` with content paths pointing to `src/app/**/*.{ts,tsx}` and `src/components/**/*.{ts,tsx}`
3. Create `apps/web/postcss.config.mjs` with tailwind plugin
4. Update `apps/web/src/app/globals.css` to replace minimal styles with Tailwind directives
5. Add Tailwind CSS variables base (light mode colors) in `:root` selector

## Inputs

- `apps/web/package.json`
- `apps/web/src/app/globals.css`

## Expected Output

- `apps/web/package.json`
- `apps/web/tailwind.config.ts`
- `apps/web/postcss.config.mjs`
- `apps/web/src/app/globals.css`

## Verification

grep -q '@tailwind' apps/web/src/app/globals.css && test -f apps/web/tailwind.config.ts && test -f apps/web/postcss.config.mjs

## Observability Impact

None - this is CSS framework setup with no runtime components.
