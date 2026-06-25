# S04: Базовый UI с shadcn ui

**Goal:** Setup shadcn/ui component library and create dashboard layout with sidebar, header, and dark/light theme support
**Demo:** Layout с sidebar header рендерится после логина

## Must-Haves

- shadcn/ui initialized with components.json configuration
- Tailwind CSS properly configured with Next.js 16 App Router
- Theme provider working with dark/light mode toggle
- Sidebar and header components created
- Dashboard layout integrated with dashboard page
- All components render without errors after login

## Proof Level

- This slice proves: visual

## Integration Closure

Upstream surfaces consumed: apps/web/src/app/page.tsx (from S03), apps/web/src/app/layout.tsx (from S03), Next.js 16 app structure. New wiring introduced: Tailwind CSS configuration, shadcn/ui component system, theme provider with next-themes, dashboard layout wrapper, sidebar/header navigation components.

## Verification

- Runtime signals: Dashboard page renders with sidebar (desktop) or hamburger menu (mobile), theme toggle switches between light/dark mode. Inspection surfaces: Browser dev tools show Tailwind classes applied, theme state persists in localStorage. Failure visibility: Missing components cause build errors, theme toggle not working shows in browser console.

## Tasks

- [x] **T01: Install and configure Tailwind CSS** `est:20m`
  Tailwind CSS is the foundation for shadcn/ui components and all UI styling. This task installs Tailwind v3 (stable, well-documented) and configures it to work with Next.js 16 App Router.
  - Files: `apps/web/package.json`, `apps/web/tailwind.config.ts`, `apps/web/postcss.config.mjs`, `apps/web/src/app/globals.css`
  - Verify: grep -q '@tailwind' apps/web/src/app/globals.css && test -f apps/web/tailwind.config.ts && test -f apps/web/postcss.config.mjs

- [x] **T02: Initialize shadcn/ui and install core dependencies** `est:15m`
  shadcn/ui provides pre-built, accessible components that follow best practices. This task sets up the shadcn/ui infrastructure and adds core utilities needed for component variants and class merging.
  - Files: `apps/web/package.json`, `apps/web/components.json`, `apps/web/src/lib/utils.ts`, `apps/web/src/app/globals.css`
  - Verify: test -f apps/web/components.json && test -f apps/web/src/lib/utils.ts && grep -q 'class-variance-authority' apps/web/package.json && grep -q 'next-themes' apps/web/package.json

- [x] **T03: Create theme provider and update root layout** `est:15m`
  next-themes requires a client-side Provider component to manage theme state. This task creates the ThemeProvider wrapper and integrates it into the root layout.
  - Files: `apps/web/src/components/theme-provider.tsx`, `apps/web/src/app/layout.tsx`
  - Verify: test -f apps/web/src/components/theme-provider.tsx && grep -q 'ThemeProvider' apps/web/src/app/layout.tsx && grep -q 'suppressHydrationWarning' apps/web/src/app/layout.tsx

- [x] **T04: Add initial shadcn/ui components** `est:15m`
  Adding specific components demonstrates the shadcn/ui system working and provides reusable primitives for the layout.
  - Files: `apps/web/src/components/ui/button.tsx`, `apps/web/src/components/ui/card.tsx`, `apps/web/src/components/ui/sheet.tsx`
  - Verify: test -f apps/web/src/components/ui/button.tsx && test -f apps/web/src/components/ui/card.tsx && test -f apps/web/src/components/ui/sheet.tsx

- [x] **T05: Create sidebar and header components** `est:30m`
  Dashboard needs persistent navigation (sidebar) and user controls (header with theme toggle).
  - Files: `apps/web/src/components/sidebar.tsx`, `apps/web/src/components/header.tsx`
  - Verify: test -f apps/web/src/components/sidebar.tsx && test -f apps/web/src/components/header.tsx && grep -q 'useTheme' apps/web/src/components/header.tsx

- [x] **T06: Create shared dashboard layout and integrate with dashboard page** `est:30m`
  A shared layout component provides consistent UI structure across all dashboard pages.
  - Files: `apps/web/src/components/dashboard-layout.tsx`, `apps/web/src/app/dashboard/page.tsx`
  - Verify: test -f apps/web/src/components/dashboard-layout.tsx && grep -q 'DashboardLayout' apps/web/src/app/dashboard/page.tsx

## Files Likely Touched

- apps/web/package.json
- apps/web/tailwind.config.ts
- apps/web/postcss.config.mjs
- apps/web/src/app/globals.css
- apps/web/components.json
- apps/web/src/lib/utils.ts
- apps/web/src/components/theme-provider.tsx
- apps/web/src/app/layout.tsx
- apps/web/src/components/ui/button.tsx
- apps/web/src/components/ui/card.tsx
- apps/web/src/components/ui/sheet.tsx
- apps/web/src/components/sidebar.tsx
- apps/web/src/components/header.tsx
- apps/web/src/components/dashboard-layout.tsx
- apps/web/src/app/dashboard/page.tsx
