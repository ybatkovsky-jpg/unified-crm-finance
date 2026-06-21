# S02: Kanban Board UI — UAT

**Milestone:** M003
**Written:** 2026-06-21T15:04:01.146Z

# UAT: S02 Kanban Board UI

## Preconditions
- Dev server running: `cd apps/web && npm run dev`
- Database has default pipeline with 8 stages
- Browser open at `http://localhost:3000/deals`

## Test Cases

### 1. Pipeline API Endpoints
**Step:** Access API endpoints via curl/fetch
- `GET /api/pipelines` - should return array of pipelines
- `GET /api/pipelines/[id]` - should return pipeline with stages sorted by order

**Expected:** JSON responses with proper structure, stages include order/isWonStage/isLostStage flags

**Type:** Integration

---

### 2. All 8 Kanban Columns Render
**Step:** Navigate to `/deals` page with empty pipeline

**Expected:** All 8 columns render (New, Qualified, Meeting, Proposal, Negotiation, Contract, Won, Lost) even with 0 deals

**Type:** Visual

---

### 3. Drag-and-Drop Full Column
**Step:** Drag a deal card and drop anywhere in target column (not just header)

**Expected:** Card moves, stage updates in DB, DealHistory record created

**Type:** Functional

---

### 4. Drag-Over Visual Feedback
**Step:** Drag card over different columns

**Expected:** Column highlights (isOver state) when card is over it

**Type:** Visual

---

### 5. Card Relations Persist After Move
**Step:** Move a card with contact and manager

**Expected:** After move, card still shows stage name, contact name, manager name

**Type:** Functional

---

### 6. Create Deal with Contact Selection
**Step:** Click "Создать сделку", search for contact, select, create deal

**Expected:** Modal shows contact list with icons/badges, search filters client-side, selected contact shows in form

**Type:** Functional

---

### 7. Status Filter
**Step:** Use FilterBar to filter by open/closed/all

**Expected:** Deals list updates to show only matching status

**Type:** Functional

---

### 8. Error Handling
**Step:** Trigger move API error (network disconnect or invalid request)

**Expected:** Error logs to console, deals refetch, UI doesn't break

**Type:** Error Case

---

## Edge Cases
- Empty pipeline: all 8 columns still render
- Move to same stage: allowed, creates DealHistory entry
- Contact with no name: shows fallback display
- Manager without name: shows email fallback
- API returns 404/500: handled with refetch

## Not Proven By This UAT
- Concurrent drag-and-drop conflicts
- Large number of stages (>8)
- Mobile/touch drag support
- Accessibility (keyboard navigation, screen reader)
