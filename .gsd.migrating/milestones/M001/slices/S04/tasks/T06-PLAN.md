---
estimated_steps: 5
estimated_files: 2
skills_used: []
---

# T06: Create shared dashboard layout and integrate with dashboard page

A shared layout component provides consistent UI structure across all dashboard pages.

## Steps

1. Create `apps/web/src/components/dashboard-layout.tsx` as server component
2. Update `apps/web/src/app/dashboard/page.tsx` to use DashboardLayout
3. Verify auth middleware still protects dashboard route

## Inputs

- `apps/web/src/components/sidebar.tsx`
- `apps/web/src/components/header.tsx`
- `apps/web/src/app/dashboard/page.tsx`

## Expected Output

- `apps/web/src/components/dashboard-layout.tsx`
- `apps/web/src/app/dashboard/page.tsx`

## Verification

test -f apps/web/src/components/dashboard-layout.tsx && grep -q 'DashboardLayout' apps/web/src/app/dashboard/page.tsx

## Observability Impact

None - this is layout component with no special observability needs.
