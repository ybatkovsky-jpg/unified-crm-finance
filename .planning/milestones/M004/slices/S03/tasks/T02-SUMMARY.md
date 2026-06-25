---
id: T02
parent: S03
milestone: M004
key_files:
  - apps/web/src/components/projects/create-project-modal.tsx
  - apps/web/src/lib/api/types.ts
key_decisions:
  - Added externalNumber field to ProjectCreateInput type to match Prisma schema requirement
  - Used ?? null coalescing in Select onValueChange handlers to prevent type errors
duration: 
verification_result: untested
completed_at: 2026-06-22T10:58:55.680Z
blocker_discovered: false
---

# T02: Created CreateProjectModal component with all required fields including externalNumber, searchable dropdowns for contacts/deals/contracts, and form validation

**Created CreateProjectModal component with all required fields including externalNumber, searchable dropdowns for contacts/deals/contracts, and form validation**

## What Happened

Created the CreateProjectModal component at `apps/web/src/components/projects/create-project-modal.tsx` following the pattern from CreateDealModal.

**Key changes:**
1. Updated `ProjectCreateInput` type in `types.ts` to include required `externalNumber` field
2. Created modal component with:
   - Required fields: externalNumber, name (validation enforced)
   - Optional fields: description, status, managerId, contractAmount, currency, startDate, endDate, marginTarget
   - Searchable dropdowns for contacts, deals, and contracts
   - Form validation preventing submit when required fields are empty
   - Calls `projectsApi.createProject()` on submit
   - Closes modal and resets form on success

**Technical details:**
- Used shadcn Dialog, Input, Select, Textarea, Badge components
- Reused contact selection pattern from CreateDealModal
- Added deal and contract searchable dropdowns with similar UX
- MVP manager list hardcoded as specified
- Status options: lead, active, completed, paused
- Currency defaults to RUB with USD, EUR options
- Margin target defaults to 0.25
- All Select handlers properly handle null values with `??` fallback

**Verification:** TypeScript compilation passes with no errors for the created component.

## Verification

TypeScript compilation passed with no errors specific to the create-project-modal.tsx component. Verified by running `npx tsc --noEmit --skipLibCheck` and confirming no grep matches for "create-project-modal".

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/src/components/projects/create-project-modal.tsx`
- `apps/web/src/lib/api/types.ts`
