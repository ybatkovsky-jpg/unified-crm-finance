---
estimated_steps: 6
estimated_files: 4
skills_used: []
---

# T02: Initialize shadcn/ui and install core dependencies

shadcn/ui provides pre-built, accessible components that follow best practices. This task sets up the shadcn/ui infrastructure and adds core utilities needed for component variants and class merging.

## Steps

1. Run `npx shadcn@latest init` from `apps/web/` directory
2. Verify `apps/web/src/lib/utils.ts` was created with `cn()` function
3. Add CSS variables for dark mode in `.dark` selector to `globals.css`
4. Install `next-themes` for theme switching

## Inputs

- `apps/web/package.json`
- `apps/web/tailwind.config.ts`
- `apps/web/src/app/globals.css`

## Expected Output

- `apps/web/package.json`
- `apps/web/components.json`
- `apps/web/src/lib/utils.ts`
- `apps/web/src/app/globals.css`

## Verification

test -f apps/web/components.json && test -f apps/web/src/lib/utils.ts && grep -q 'class-variance-authority' apps/web/package.json && grep -q 'next-themes' apps/web/package.json

## Observability Impact

None - this is component library setup with no runtime components.
