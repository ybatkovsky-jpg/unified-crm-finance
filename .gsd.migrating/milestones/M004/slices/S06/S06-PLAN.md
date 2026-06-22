# S06: Production Management

**Goal:** Enable users to create and manage Production records within projects - tracking manufacturing processes for stone materials (plates and countertops) with their own independent stage pipeline
**Demo:** User can create Production records (PLATE/COUNTERTOP), manage production stages, see status in project detail

## Must-Haves

- User can navigate to project detail page and see 'Производство' section
- User can click 'Добавить производство' to open modal and create production
- Production appears in list with correct type badge, status, and progress bar
- Expanding production shows all 8 auto-created stages with correct status colors
- User can move stage status and see progress update
- User can start/complete production workflow via quick actions
- User can delete production with confirmation

## Proof Level

- This slice proves: integration

## Integration Closure

API routes expose Production/ProductionStage CRUD via Next.js API endpoints. API client wraps endpoints in typed ProductionApiClient. UI components (modal, list, detail card) consume API client. Project detail page integrated with production section. ProductionRepository (S01) used as data layer.

## Verification

- Console logging for API errors with user-friendly display. Loading states visible in UI. Error messages displayed to users. Production progress updates visible in UI.

## Tasks

- [x] **T01: API Routes - Production Endpoints** `est:1h`
  Create Next.js API routes for Production CRUD operations. Following the established pattern from projects API, implement:
  - Files: `apps/web/src/app/api/projects/[id]/productions/route.ts`, `apps/web/src/app/api/productions/[id]/route.ts`
  - Verify: npx tsc --noEmit 2>&1 | grep -q 'productions' || echo 'TypeScript OK'

- [x] **T02: API Routes - ProductionStage Endpoints** `est:45m`
  Create Next.js API routes for ProductionStage CRUD operations.
  - Files: `apps/web/src/app/api/productions/[id]/stages/route.ts`, `apps/web/src/app/api/stages/[id]/route.ts`
  - Verify: npx tsc --noEmit 2>&1 | grep -q 'stages' || echo 'TypeScript OK'

- [x] **T03: API Client + Types - Production** `est:1h`
  Create ProductionApiClient and add production types to apps/web/src/lib/api/types.ts.
  - Files: `apps/web/src/lib/api/types.ts`, `apps/web/src/lib/api/productions.ts`
  - Verify: npx tsc --noEmit 2>&1 | grep -q 'productions' || echo 'TypeScript OK'

- [x] **T04: Create Production Modal Component** `est:1h`
  Build CreateProductionModal component following CreateProjectModal pattern.
  - Files: `apps/web/src/components/projects/create-production-modal.tsx`
  - Verify: npx tsc --noEmit 2>&1 | grep -q 'create-production-modal' || echo 'TypeScript OK'

- [x] **T05: Production List Component** `est:1h`
  Build ProductionList component to display all productions for a project.
  - Files: `apps/web/src/components/projects/production-list.tsx`
  - Verify: npx tsc --noEmit 2>&1 | grep -q 'production-list' || echo 'TypeScript OK'

- [x] **T06: Production Detail Card Component** `est:1h`
  Build ProductionDetailCard - expandable component showing full production details and stages.
  - Files: `apps/web/src/components/projects/production-detail-card.tsx`
  - Verify: npx tsc --noEmit 2>&1 | grep -q 'production-detail-card' || echo 'TypeScript OK'

- [x] **T07: Project Detail Page Integration** `est:45m`
  Add Production section to project detail page.
  - Files: `apps/web/src/app/projects/[id]/page.tsx`
  - Verify: grep -q 'Производство' apps/web/src/app/projects/[id]/page.tsx && grep -q 'ProductionList' apps/web/src/app/projects/[id]/page.tsx && echo 'Integration OK'

## Files Likely Touched

- apps/web/src/app/api/projects/[id]/productions/route.ts
- apps/web/src/app/api/productions/[id]/route.ts
- apps/web/src/app/api/productions/[id]/stages/route.ts
- apps/web/src/app/api/stages/[id]/route.ts
- apps/web/src/lib/api/types.ts
- apps/web/src/lib/api/productions.ts
- apps/web/src/components/projects/create-production-modal.tsx
- apps/web/src/components/projects/production-list.tsx
- apps/web/src/components/projects/production-detail-card.tsx
- apps/web/src/app/projects/[id]/page.tsx
