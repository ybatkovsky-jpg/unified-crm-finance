# S03: Deal Detail Page and History Timeline — UAT

**Milestone:** M003
**Written:** 2026-06-21T15:15:31.508Z

# UAT: Deal Detail Page and History Timeline

## Preconditions
- System is running with a deal that has at least one stage transition history entry
- User is logged in and has access to the deals module

## Test Cases

### TC1: View Deal Detail Page
1. Navigate to `/deals/[id]` for an existing deal
2. **Expected**: Page displays deal card showing:
   - Deal title
   - Contact information (linked contact)
   - Current stage badge
   - Deal amount with currency
   - Expected close date
   - Manager assigned

### TC2: View Deal History Timeline
1. On the deal detail page, scroll to the "История изменений" section
2. **Expected**: 
   - DealHistoryTimeline component renders without errors
   - Each history entry shows:
     - Badge "Stage Change" with History icon
     - fromStage name → toStage name with ArrowRight icon (e.g., "Lead → Qualification")
     - Date and time of change
     - User who made the change
     - Comment (if provided)
   - Entries are ordered by changedAt descending (newest first)

### TC3: Empty History State
1. Navigate to `/deals/[id]` for a newly created deal with no history
2. **Expected**: Timeline shows "No history yet" message

### TC4: Loading State
1. Slow network simulation or initial page load
2. **Expected**: Loading spinner appears before timeline renders

## UAT Type
Functional UI verification - component rendering and data display

## Not Proven By This UAT
- Real-time updates (websocket/polling)
- Mobile responsiveness
- Accessibility features
- Error recovery on API failure
