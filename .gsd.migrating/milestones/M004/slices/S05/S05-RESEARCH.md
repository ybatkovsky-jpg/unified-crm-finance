# Slice S05 Research: Gantt Timeline

## Overview
Research implementation requirements for a Gantt timeline visualization feature that displays project stages with dates, color coding by status, and drag-drop date editing capabilities.

## Implementation Landscape

### Key Files
- **Component to create**: `apps/web/src/components/projects/project-gantt.tsx`
- **Integration point**: `apps/web/src/app/projects/[id]/page.tsx` (lines 441-487: Stages section)
- **API client**: `apps/web/src/lib/api/projects.ts` (extend with stage update methods)
- **Repository**: `apps/web/src/lib/db/projects.ts` (has `updateStage`, `findStages` methods)
- **API route needed**: `apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts` (new)

### Dependencies Status
- **vis-timeline**: NOT installed (v8.5.1 available, actively maintained)
  - Installation required: `npm install vis-timeline vis-data`
  - Alternative: `razbensimon/react-vis-timeline` wrapper (TypeScript-based)
- **@dnd-kit/core**: Already installed (^6.3.1) - but vis-timeline has built-in drag-drop
- **No React Query library**: Not installed in this codebase

### Data Model (from Prisma schema)
```prisma
model ProjectStage {
  id          String    @id
  projectId   String
  code        String
  name        String
  order       Int
  status      String    @default("pending")  // pending, active, completed, blocked
  startDate   DateTime?
  endDate     DateTime?
  completedAt DateTime?
  assigneeId  String?
  notes       String?
  Project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@unique([projectId, code])
  @@index([projectId, order])
}
```

### Existing Status Color Function (from project detail page)
```typescript
function getStageStatusColor(status: string): string {
  switch (status) {
    case "completed": return "#22c55e"  // green
    case "active":    return "#3b82f6"  // blue
    case "pending":   return "#94a3b8"  // gray
    case "blocked":   return "#ef4444"  // red
    default:          return "#94a3b8"  // gray
  }
}
```

## Build Order

### 1. Install vis-timeline dependency
```bash
cd apps/web && npm install vis-timeline vis-data
```

### 2. Create API route for stage updates
`apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts`
- PATCH endpoint for updating stage dates via drag-drop
- Use existing `projects.updateStage(stageId, data)` method

### 3. Extend API client
Add to `apps/web/src/lib/api/projects.ts`:
```typescript
async updateStage(stageId: string, data: ProjectStageUpdateInput): Promise<ApiResponse<ProjectStageData>>
```

### 4. Create ProjectGantt component
`apps/web/src/components/projects/project-gantt.tsx`
- Initialize vis-timeline with stages data
- Configure color mapping by status
- Enable drag-drop for date editing (day-level precision)
- Handle `onMove` event to persist changes

### 5. Integrate into project detail page
Replace lines 441-487 in `apps/web/src/app/projects/[id]/page.tsx` (current Stages Card) with Gantt component

## Patterns to Reuse

### From kanban-board.tsx
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
)
```
Note: vis-timeline has its own drag-drop, but this pattern shows activation constraints.

### From deal-history-timeline.tsx
- Date formatting: `Intl.DateTimeFormat("ru-RU", ...)` for Russian locale
- Loading/error states pattern with Loader2 and AlertCircle icons

### From ProjectRepository
- Methods already exist: `updateStage(stageId, data)`, `findStages(projectId)`
- No new repository code needed

### From project detail page
- `getStageStatusColor(status)` function for consistent color coding
- Russian language labels pattern (Шаг: , с , по , etc.)

## Don't Hand-Roll

**Use vis-timeline library instead of custom implementation because:**
- Gantt charts require complex date math, collision detection, zoom/pan logic
- vis-timeline is actively maintained (v8.5.1 published 16 days ago)
- Built-in drag-drop, touch support, keyboard navigation
- Custom styling support via CSS variables
- Performance-optimized for large datasets

**Alternatives considered:**
- `@dnd-kit` (already installed): Good for list drag-drop, not for timeline
- `react-gantt-chart`: Less mature, fewer features
- Custom SVG implementation: Too much complexity

## Technical Considerations

### Date Handling
- Stage dates are nullable (`startDate`, `endDate` can be null)
- Need fallback logic: stages without dates render as single-point or placeholder
- Use `new Date()` conversion for vis-timeline format

### Status Color Mapping
The component should map status to bar colors:
- pending: `#94a3b8` (gray)
- active: `#3b82f6` (blue)
- completed: `#22c55e` (green)
- blocked: `#ef4444` (red)

### Drag-Drop Constraints
- Enable drag at day-level zoom only
- Validate: endDate >= startDate after move
- Call API on drop completion (debounce if needed)

### Russian Language
All labels and date formats should use Russian locale:
- Months: `Intl.DateTimeFormat("ru-RU", { month: "long" })`
- Stage labels: "Этап", "Даты", etc.

## API Type Definitions Needed (extend types.ts)

```typescript
// Already exists:
export interface ProjectStageData extends Omit<ProjectStage, 'projectId'> {}
export interface ProjectStageUpdateInput { /* already defined */ }

// May need to add:
export interface ProjectStageApiParams {
  projectId: string;
  stageId: string;
}
```

## Integration Points

### Current Stages Display (to be replaced)
Lines 441-487 in `apps/web/src/app/projects/[id]/page.tsx`:
- Shows stages as vertical list with colored dots
- Displays: name, code badge, dates, assignee
- New Gantt will show same info horizontally

### Project Data Flow
1. `project.stages` array from API response
2. Map to vis-timeline data format
3. Render timeline
4. On drag: `projectsApi.updateStage(stageId, { startDate, endDate })`
5. Re-fetch project or optimistically update local state

## Risk Assessment

### Medium Risk
- **vis-timeline SSR compatibility**: May need "use client" directive
- **Date timezone handling**: Prisma DateTime -> vis-timeline Date conversion
- **Nullable dates**: Need graceful handling for stages without dates

### Low Risk
- **API methods exist**: Repository has `updateStage` ready
- **Status colors defined**: Already implemented in detail page
- **Repository pattern**: Established pattern to follow

## Dependencies External
- vis-timeline@8.5.1 (npm package)
- vis-data@latest (peer dependency)

## Files Created/Modified Summary

### New Files
1. `apps/web/src/components/projects/project-gantt.tsx` - Main Gantt component
2. `apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts` - Stage update API

### Modified Files
1. `apps/web/src/lib/api/projects.ts` - Add `updateStage` client method
2. `apps/web/src/lib/api/types.ts` - Add stage update types if needed
3. `apps/web/src/app/projects/[id]/page.tsx` - Replace Stages Card with Gantt
4. `apps/web/package.json` - Add vis-timeline dependency

## Success Criteria Met
- [x] Identify existing timeline implementations (none suitable for Gantt)
- [x] Confirm data model has required fields (yes: startDate, endDate, status, order)
- [x] Select appropriate library (vis-timeline v8.5.1)
- [x] Map existing status colors to Gantt bars
- [x] Define integration point (replace lines 441-487 in detail page)
- [x] Identify API requirements (PATCH endpoint for stage updates)
