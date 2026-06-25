# S05: Gantt Timeline

**Goal:** Implement Gantt timeline visualization for project stages with drag-drop date editing, color coding by status, and day-level zoom
**Demo:** User can see Gantt chart on project detail, drag dates to update, color coding by status, day-level zoom

## Must-Haves

- User can view Gantt chart on project detail page showing all project stages with dates
- Bars are color-coded by stage status (green=completed, blue=active, gray=pending, red=blocked)
- User can drag stage bars to change start/end dates, changes persist to database
- Timeline uses day-level zoom for clear date visualization
- Loading and error states render gracefully

## Proof Level

- This slice proves: integration

## Integration Closure

Upstream: ProjectRepository.updateStage() exists, project detail page displays stages. New: vis-timeline integration, stage update API route, API client method, Gantt component. Remains: S06 Production Management, S07 File Upload.

## Verification

- Console logging for drag-drop operations and API errors
- Loading states visible during timeline initialization and updates
- Error messages displayed to users on update failures

## Tasks

- [x] **T01: Install vis-timeline dependency** `est:5m`
  Install vis-timeline and vis-data npm packages for Gantt chart visualization. This is the foundational library for the timeline feature.
  - Files: `apps/web/package.json`
  - Verify: grep vis-timeline apps/web/package.json

- [x] **T02: Create stage update API route** `est:20m`
  Create PATCH endpoint at /api/projects/[id]/stages/[stageId]/route.ts for updating stage dates via drag-drop. This enables the Gantt component to persist date changes.
  - Files: `apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts`
  - Verify: test -f apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts

- [x] **T03: Extend API client with stage update method** `est:15m`
  Add updateStage method to ProjectApiClient in apps/web/src/lib/api/projects.ts. This provides a TypeScript-typed client method for the Gantt component to call.
  - Files: `apps/web/src/lib/api/projects.ts`
  - Verify: grep updateStage apps/web/src/lib/api/projects.ts

- [x] **T04: Create ProjectGantt component** `est:1.5h`
  Create vis-timeline based Gantt component at apps/web/src/components/projects/project-gantt.tsx. This is the core UI component for timeline visualization.
  - Files: `apps/web/src/components/projects/project-gantt.tsx`
  - Verify: test -f apps/web/src/components/projects/project-gantt.tsx

- [x] **T05: Integrate Gantt into project detail page** `est:30m`
  Replace the existing Stages list (lines 441-487) in project detail page with the new ProjectGantt component. This completes the integration and makes the feature visible to users.
  - Files: `apps/web/src/app/projects/[id]/page.tsx`
  - Verify: grep ProjectGantt apps/web/src/app/projects/[id]/page.tsx

- [x] **T06: TypeScript compilation check** `est:5m`
  Run TypeScript compiler to verify no type errors in new Gantt component and updated project detail page. This ensures type safety and catches any integration issues.
  - Verify: cd apps/web && npx tsc --noEmit --skipLibCheck

## Files Likely Touched

- apps/web/package.json
- apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts
- apps/web/src/lib/api/projects.ts
- apps/web/src/components/projects/project-gantt.tsx
- apps/web/src/app/projects/[id]/page.tsx
