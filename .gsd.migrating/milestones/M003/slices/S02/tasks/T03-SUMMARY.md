---
id: T03
parent: S02
milestone: M003
key_files: []
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-21T15:02:53.002Z
blocker_discovered: false
---

# T03: Fixed TypeScript errors in CreateDealModal and deal-card component - removed asChild prop (base-ui doesn't support it), fixed onValueChange handler, and corrected Contact/User name display logic

**Fixed TypeScript errors in CreateDealModal and deal-card component - removed asChild prop (base-ui doesn't support it), fixed onValueChange handler, and corrected Contact/User name display logic**

## What Happened

Fixed TypeScript errors that were introduced during initial implementation:
1. Removed `asChild` prop from DialogTrigger - @base-ui/react Dialog doesn't support this prop
2. Fixed Select component - using `onValueChange` with correct type signature `(value: string | null) => void`
3. Fixed Contact name display - Contact model has firstName/lastName/companyName (not `name`), so used conditional display based on type
4. Fixed User name display - User model has `name` field (not firstName/lastName), so used `name || email` fallback

## Verification

`npx tsc --noEmit` shows no errors in create-deal-modal.tsx or deal-card.tsx

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd apps/web && npx tsc --noEmit 2>&1 | grep -E 'create-deal-modal|deal-card'` | 0 | pass | 3000ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

None.
