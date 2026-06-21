---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T03: Create theme provider and update root layout

next-themes requires a client-side Provider component to manage theme state. This task creates the ThemeProvider wrapper and integrates it into the root layout.

## Steps

1. Create `apps/web/src/components/theme-provider.tsx` as a client component
2. Update `apps/web/src/app/layout.tsx` to import and use ThemeProvider
3. Add `suppressHydrationWarning` to `<html>` tag

## Inputs

- `apps/web/package.json`
- `apps/web/src/app/layout.tsx`

## Expected Output

- `apps/web/src/components/theme-provider.tsx`
- `apps/web/src/app/layout.tsx`

## Verification

test -f apps/web/src/components/theme-provider.tsx && grep -q 'ThemeProvider' apps/web/src/app/layout.tsx && grep -q 'suppressHydrationWarning' apps/web/src/app/layout.tsx

## Observability Impact

None - this is client-side theme provider setup.
