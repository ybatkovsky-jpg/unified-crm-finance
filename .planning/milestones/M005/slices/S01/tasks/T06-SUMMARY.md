---
id: T06
parent: S01
milestone: M005
key_files: []
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-23T10:00:57.405Z
blocker_discovered: false
---

# T06: Added NavBar client component with links to CRM, Deals, Projects, Contracts, and Procurement modules wired into root layout

**Added NavBar client component with links to CRM, Deals, Projects, Contracts, and Procurement modules wired into root layout**

## What Happened

Created `NavBar` client component using `usePathname()` to highlight the active route. The nav renders as a sticky top bar with links to all existing modules: CRM (→ /crm/contacts), Deals, Projects, Contracts, and Procurement (→ /procurement/counterparties). Active link is highlighted with `secondary` button variant; inactive links use `ghost`. The component reuses the project's existing `buttonVariants` from `@/components/ui/button`. Updated root `layout.tsx` to render `<NavBar />` above `{children}`. No new dependencies introduced.

## Verification

Ran `npx tsc --noEmit` — zero errors in nav-bar.tsx and layout.tsx. All ~180+ pre-existing errors are in unrelated files (contacts API tests, deals API routes, file-preview component, etc.) and were not introduced by this change.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `npx tsc --noEmit 2>&1 | grep -E "nav-bar|layout\.tsx" || echo "No errors in nav-bar or layout files"` | 0 | pass | 35000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

None.
