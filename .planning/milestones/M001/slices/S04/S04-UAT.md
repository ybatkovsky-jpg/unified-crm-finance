# S04: Базовый UI с shadcn ui — UAT

**Milestone:** M001
**Written:** 2026-06-21T00:10:32.874Z

# S04: Базовый UI с shadcn ui — UAT

**Milestone:** M001
**Written:** 2026-06-21

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: This slice establishes UI infrastructure (Tailwind, shadcn/ui, layout components) that will be validated visually when S03 login flow is working and users can access the dashboard. The artifacts created (config files, components) are verified through build compilation and file existence checks.

## Preconditions

- Docker Compose services running (from S01)
- Node.js dependencies installed in apps/web
- Next.js development server or production build available

## Smoke Test

```bash
cd apps/web && npm run build
```
Expected: Build completes successfully with no TypeScript or compilation errors.

## Test Cases

### 1. Tailwind CSS Configuration

1. Check `apps/web/tailwind.config.ts` exists with content paths for App Router
2. Check `apps/web/src/app/globals.css` contains `@tailwind` directives
3. **Expected:** Configuration files present, Tailwind directives active

### 2. shadcn/ui Infrastructure

1. Check `apps/web/components.json` exists with proper configuration
2. Check `apps/web/src/lib/utils.ts` contains `cn()` function
3. Check `package.json` includes `class-variance-authority` and `next-themes`
4. **Expected:** All shadcn/ui infrastructure files and dependencies present

### 3. Theme Provider

1. Check `apps/web/src/components/theme-provider.tsx` exists
2. Check `apps/web/src/app/layout.tsx` imports and uses `ThemeProvider`
3. Check `<html>` tag has `suppressHydrationWarning` attribute
4. **Expected:** Theme provider properly integrated for dark/light mode

### 4. UI Components Library

1. Check `apps/web/src/components/ui/button.tsx` exists
2. Check `apps/web/src/components/ui/card.tsx` exists
3. Check `apps/web/src/components/ui/sheet.tsx` exists
4. **Expected:** shadcn/ui components available for use

### 5. Sidebar and Header Components

1. Check `apps/web/src/components/sidebar.tsx` exists with navigation items
2. Check `apps/web/src/components/header.tsx` exists with `useTheme` hook
3. **Expected:** Navigation and header components created with theme support

### 6. Dashboard Layout Integration

1. Check `apps/web/src/components/dashboard-layout.tsx` exists
2. Check `apps/web/src/app/dashboard/page.tsx` imports `DashboardLayout`
3. **Expected:** Dashboard page uses shared layout component

## Edge Cases

### Build Failure with Missing Dependencies

1. Run `npm install` to ensure all dependencies are present
2. Run `npm run build`
3. **Expected:** Build succeeds, all TypeScript types resolve correctly

## Failure Signals

- Build fails with "Cannot find module" errors → missing dependencies
- TypeScript errors about missing types → incorrect package installation
- Tailwind classes not applying → misconfigured content paths or missing directives
- Theme toggle causes hydration warnings → missing suppressHydrationWarning

## Not Proven By This UAT

- Visual rendering of sidebar and header (requires S03 login flow + running dev server)
- Theme toggle functionality in browser (requires runtime testing)
- Responsive mobile navigation (requires browser viewport testing)
- Active route highlighting in sidebar (requires routing context)

## Notes for Tester

This slice creates the UI foundation. Visual verification will be possible after S03 login flow is complete and users can access `/dashboard` route. The components use shadcn/ui patterns with CSS variables for theming—ensure CSS variables in `globals.css` are not modified by subsequent styles unless intentional.
