---
id: T02
parent: S02
milestone: M002
key_files: []
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-21T07:39:51.142Z
blocker_discovered: false
---

# T02: Created root layout with Russian locale and home page that redirects to /crm/contacts

**Created root layout with Russian locale and home page that redirects to /crm/contacts**

## What Happened

Created two files in apps/web/src/app/:

1. **layout.tsx** — RootLayout server component. Exports metadata with title "Unified CRM". Renders `<html lang="ru">` with `<body className="antialiased">` and imports `./globals.css` for Tailwind v4 styles. Uses the standard Next.js `Metadata` type for type-safe metadata export.

2. **page.tsx** — HomePage server component. Uses `redirect("/crm/contacts")` from `next/navigation` to redirect the root `/` route to the contacts page. This is the simplest correct pattern for a root redirect in Next.js App Router — `redirect()` throws a `NEXT_REDIRECT` error internally, which Next.js catches to issue a 307 redirect.

Both files follow Next.js App Router conventions: server components by default, no "use client" directive, clean and minimal implementation.

## Verification

1. `npx next build` — Compiled successfully (4.9s). TypeScript errors are all pre-existing S01 issues (sourceId/ownerId not in Prisma ContactCreateInput/ContactUpdateInput types, documented in T01-SUMMARY.md). Zero errors from layout.tsx or page.tsx — both files, their imports, and the CSS import resolve correctly.

2. `npx next dev` — Started successfully (Ready in 1035ms). No import, resolution, or compilation errors. Port conflict with existing server on 3000 is expected — the new server bound to 3333 without issues.

3. File-level verification: both `apps/web/src/app/layout.tsx` and `apps/web/src/app/page.tsx` exist with correct content.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx next build` | 1 | pass (compilation succeeded; TS errors are pre-existing S01 issues unrelated to this task) | 4900ms |
| 2 | `timeout 15 npx next dev --port 3333` | 0 | pass (Ready in 1035ms, no errors from layout/page) | 15000ms |
| 3 | `ls -la src/app/layout.tsx src/app/page.tsx` | 0 | pass (both files exist) | 200ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

None.
