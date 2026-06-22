# S05: Gantt Timeline — UAT

**Milestone:** M004
**Written:** 2026-06-22T13:32:50.231Z

## UAT: Gantt Timeline Feature

### Test Scenario 1: View Gantt Timeline
1. Navigate to a project detail page (e.g., `/projects/{id}`)
2. Scroll to the "Этапы проекта" (Project Stages) section
3. **Expected:** Gantt timeline is displayed showing all project stages as horizontal bars
4. **Expected:** Stages are color-coded by status (green=completed, blue=active, gray=pending, red=blocked)

### Test Scenario 2: Drag Stage to Change Dates
1. Click and hold on any stage bar in the Gantt timeline
2. Drag the stage to a new position
3. Release the mouse
4. **Expected:** Loading indicator appears "Сохранение изменений..."
5. **Expected:** Stage moves to new position
6. **Expected:** Success - no error message displayed
7. **Check console:** "[ProjectGantt] Stage updated successfully" message logged

### Test Scenario 3: Zoom Timeline
1. Use mouse wheel or pinch gesture over the timeline
2. **Expected:** Timeline zooms in/out between day-level and month-level view
3. **Expected:** Stage bars adjust proportionally

### Test Scenario 4: Empty State
1. Navigate to a project with no stages
2. **Expected:** "Нет этапов" (No stages) message displayed

### Test Scenario 5: Error Handling
1. Open browser DevTools Network tab
2. Throttle network to "Offline"
3. Attempt to drag a stage
4. **Expected:** Error message displayed "Failed to update stage"
5. **Expected:** Stage reverts to original position

### Console Logging Checks
- Open browser console before testing
- Look for: "[ProjectGantt] Initializing timeline with N stages"
- Look for: "[ProjectGantt] Drag start: {stageId}"
- Look for: "[ProjectGantt] Stage dragged: {stageId} new dates: ..."
- Look for: "[API] Stage {stageId} updated for project {projectId}"

