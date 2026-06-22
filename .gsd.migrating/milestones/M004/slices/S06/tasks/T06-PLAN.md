---
estimated_steps: 15
estimated_files: 1
skills_used: []
---

# T06: Production Detail Card Component

Build ProductionDetailCard - expandable component showing full production details and stages.

Create apps/web/src/components/projects/production-detail-card.tsx:
- Expandable/collapsible card with production details
- Header shows: type, status badge, progress bar
- Expanded content shows:
  - Dates (planned/actual start, planned/actual end)
  - Notes field
  - Stages list with color-coded status indicators
  - Each stage: name, status badge, date range
- Quick action buttons:
  - Start (sets status to active, actualStartDate)
  - Complete (sets status to completed, progress=100, actualEndDate)
  - Status change dropdown
- Edit mode for updating notes/dates
- Follows same UI patterns as project detail cards

## Inputs

- `apps/web/src/components/projects/production-list.tsx`
- `apps/web/src/lib/api/productions.ts`

## Expected Output

- `apps/web/src/components/projects/production-detail-card.tsx`

## Verification

npx tsc --noEmit 2>&1 | grep -q 'production-detail-card' || echo 'TypeScript OK'
