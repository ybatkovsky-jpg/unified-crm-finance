# M001/S04 — Research

**Date:** 2026-06-21

## Summary

S04 requires setting up shadcn/ui component library and creating a basic dashboard layout with sidebar, header, and theme support (dark/light mode). This is a straightforward UI infrastructure task using established tools—shadcn/ui is officially documented for Next.js 15+ with React 19, and while Next.js 16 is newer, the same patterns apply based on community guides and starter templates.

The research confirms shadcn/ui works with Next.js 16 and React 19. The project already uses utility classes (e.g., in dashboard/page.tsx), so adding Tailwind CSS and shadcn/ui is a natural fit. The main work is: (1) install Tailwind CSS and configure it, (2) run shadcn/ui CLI to set up components.json and core utilities, (3) create a shared DashboardLayout component with sidebar/header, (4) add theme provider for dark mode, and (5) add a few initial components (Button, Card, Sheet for mobile nav).

## Recommendation

Use the official shadcn/ui Next.js installation guide with Tailwind CSS v3 (stable, well-documented) rather than v4 (still evolving). Install dependencies via pnpm/npm, initialize shadcn/ui with the CLI, then build the layout incrementally: theme provider first, then shared layout wrapper, then sidebar/header components, then mobile responsiveness using Sheet component.

## Implementation Landscape

### Key Files

- `apps/web/src/app/layout.tsx` — Root layout that needs ThemeProvider wrapper and globals.css import
- `apps/web/src/app/globals.css` — CSS file that will be replaced/updated with Tailwind directives and shadcn/ui CSS variables
- `apps/web/src/app/dashboard/page.tsx` — Existing dashboard page with inline Tailwind classes; will use new layout wrapper
- `apps/web/package.json` — Needs Tailwind CSS, shadcn/ui CLI, and core dependencies (class-variance-authority, clsx, tailwind-merge, lucide-react, next-themes, @radix-ui packages)
- `apps/web/components.json` — New file created by shadcn/ui CLI for component configuration
- `apps/web/tailwind.config.ts` — New file for Tailwind configuration
- `apps/web/postcss.config.mjs` — New file for PostCSS with Tailwind plugin
- `apps/web/src/lib/utils.ts` — New utility file for cn() function (clsx + tailwind-merge)
- `apps/web/src/components/theme-provider.tsx` — New client component wrapping next-themes
- `apps/web/src/components/dashboard-layout.tsx` — New shared layout with sidebar, header, mobile drawer
- `apps/web/src/components/sidebar.tsx` — New sidebar component with navigation menu
- `apps/web/src/components/header.tsx` — New header component with user menu and theme toggle
- `apps/web/src/components/button.tsx` — First shadcn/ui component to add (core dependency)

### Build Order

1. **Install and configure Tailwind CSS** — Foundation for all styling. Update globals.css with Tailwind directives (@tailwind base/components/utilities). Create tailwind.config.ts pointing to src/ paths.

2. **Initialize shadcn/ui** — Run CLI to setup components.json and install core dependencies (class-variance-authority, clsx, tailwind-merge, lucide-react). This creates the infrastructure for adding individual components.

3. **Create utilities and theme provider** — Add src/lib/utils.ts with cn() function. Create src/components/theme-provider.tsx as a client component wrapping next-themes Provider. Wrap root layout children in ThemeProvider.

4. **Create shared dashboard layout** — Build src/components/dashboard-layout.tsx as a server component wrapper that includes sidebar, header, and main content area. Update dashboard/page.tsx to remove inline layout and use the shared wrapper.

5. **Add sidebar and header components** — Build src/components/sidebar.tsx with navigation menu (desktop: always visible, mobile: collapsed/Sheet). Build src/components/header.tsx with user info and theme toggle button. Use lucide-react icons (Menu, User, Sun/Moon, LogOut).

6. **Add initial shadcn/ui components** — Use shadcn CLI to add Button, Card, Sheet components (for mobile navigation drawer). These components demonstrate the system working and provide reusable primitives.

7. **Update CSS variables for theming** — Configure CSS variables in globals.css for light/dark mode colors (background, foreground, primary, secondary, etc.). shadcn/ui components consume these variables automatically.

### Verification Approach

- `pnpm dev` starts without errors
- `apps/web/src/app/dashboard/page.tsx` renders with new layout (sidebar visible, header at top)
- Theme toggle button switches between light/dark mode (check documentElement class or theme storage)
- Mobile view (<768px) shows hamburger menu that opens Sheet sidebar
- shadcn/ui Button component renders correctly (test in dashboard header)
- CSS variables are defined in globals.css (check :root and .dark selectors)

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Component styling with variants | class-variance-authority (cva) | Type-safe variant patterns (primary/secondary, sizes) used by all shadcn/ui components |
| Merging Tailwind classes | tailwind-merge + clsx | Prevents class conflicts (p-4 vs p-2) and duplicates, standard shadcn/ui pattern |
| Theme switching | next-themes | Handles SSR hydration, localStorage persistence, system preference detection |
| Icon library | lucide-react | Lightweight, tree-shakeable, consistent with shadcn/ui defaults |
| Mobile drawer | shadcn/ui Sheet component | Radix UI primitive, accessible, already configured by shadcn/ui CLI |

## Constraints

- Next.js 16 App Router patterns must be followed (layout.tsx structure, server components by default)
- Theme provider must be a client component ('use client' directive) because next-themes uses React context and hooks
- CSS variables for theming must be defined in globals.css before @tailwind directives (shadcn/ui convention)
- Dashboard layout must preserve auth middleware protection from S03 (no new public routes)

## Common Pitfalls

- **Tailwind purge paths** — Must include src/ directories in tailwind.config.ts content array or classes won't generate
- **Theme SSR mismatch** — next-themes requires suppressHydrationWarning on html tag to avoid hydration errors
- **shadcn/ui CLI location** — Must run from apps/web/ directory, not project root, for correct paths
- **Component imports** — shadcn/ui adds components to src/components/ui/, not src/components/, adjust imports accordingly
- **Sheet mobile nav** — Sheet component requires Trigger/Content pattern, don't try to use as standalone component

## Open Risks

- **Next.js 16 compatibility** — shadcn/ui officially supports Next.js 15 + React 19. However, 2026 community guides and starter templates confirm Next.js 16 works. Watch for CLI or dependency issues.
- **Tailwind v4 migration** — Tailwind v4 has breaking changes (CSS-first, new @theme syntax). Use v3 for stability; v4 migration is a separate task.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| shadcn/ui | official docs (ui.shadcn.com) | Available — docs are comprehensive and up-to-date |
| next-themes | official docs | Available — simple wrapper pattern |
| Tailwind CSS | official docs | Available — standard utility patterns |

## Sources

- [Shadcn UI Next.js Installation Guide](https://ui.shadcn.com/docs/installation/next)
- [Shadcn UI React 19 Support](https://ui.shadcn.com/docs/react-19)
- [Shadcn UI Dark Mode for Next.js](https://ui.shadcn.com/docs/dark-mode/next)
- [Shadcn UI Sidebar Component](https://ui.shadcn.com/docs/components/radix/sidebar)
- [Shadcn UI Sheet Component](https://ui.shadcn.com/docs/components/radix/sheet)
- [Shadcn UI Manual Installation](https://ui.shadcn.com/docs/installation/manual)
- [Tailwind v4 Upgrade Guide](https://ui.shadcn.com/docs/tailwind-v4)
- [freeCodeCamp: Admin Dashboard Sidebar with shadcn/ui](https://www.freecodecamp.org/news/build-an-admin-dashboard-sidebar-with-shadcn-ui-and-base-ui/)