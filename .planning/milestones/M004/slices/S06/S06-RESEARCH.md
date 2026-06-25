# S06: Production Management - Research

## Overview

This slice enables users to create and manage Production records within a project. Production entities track manufacturing processes for stone materials (plates and countertops) with their own stage pipeline independent from project stages.

## Existing Infrastructure (from S01)

### Prisma Schema

**Production Model** (`apps/web/prisma/schema.prisma`):
- `id`: String (primary key)
- `projectId`: String (unique, 1:1 to Project)
- `status`: String (default: "planning")
- `plannedStartDate`, `plannedEndDate`, `actualStartDate`, `actualEndDate`: DateTime?
- `progress`: Float (default: 0)
- `notes`, `attributes`: String/Json?
- `createdAt`, `updatedAt`, `deletedAt`: timestamps
- Relation: `ProductionStage[]` (1:N, cascade delete)

**ProductionStage Model**:
- `id`: String (primary key)
- `productionId`: String (foreign key)
- `code`, `name`: String
- `order`: Int
- `status`: String (default: "pending")
- `startDate`, `endDate`, `completedAt`: DateTime?
- `assigneeId`, `notes`: String?
- Unique constraint: `[productionId, code]`

### ProductionRepository (`apps/web/src/lib/db/production.ts`)

Already implemented with:
- `findMany()`, `findUnique()`, `findByProject()`, `findByStatus()`
- `create()`, `update()`, `softDelete()`, `count()`
- `start()`, `complete()`, `moveStatus()`, `updateProgress()`
- Stage methods: `findStages()`, `createStage()`, `updateStage()`, `moveStage()`, `deleteStage()`, `countStages()`

## UI Context (from S04)

### Project Detail Page (`apps/web/src/app/projects/[id]/page.tsx`)

Key patterns to follow:
- Client-side page using `projectsApi` from `@/lib/api/projects`
- Editable form with inline edit mode toggle
- Status badges with color variants
- Card-based layout with sections (Details, Stages, Team, Related entities)
- Uses `ApiClientError` for error handling
- Russian labels for all UI text

### Existing Components Available

- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `DialogTrigger` from `@/components/ui/dialog`
- `Button`, `Input`, `Label`, `Select`, `Textarea`, `Badge`, `Card` from `@/components/ui/*`
- `CreateProjectModal` (`apps/web/src/components/projects/create-project-modal.tsx`) - pattern reference

## Required Implementation

### 1. API Layer - Production Endpoints

**File**: `apps/web/src/app/api/projects/[id]/productions/route.ts`
- GET: List productions for a project (with stages)
- POST: Create new production (requires unique projectId check)

**File**: `apps/web/src/app/api/productions/[id]/route.ts`
- GET: Fetch single production with stages
- PATCH: Update production (status, progress, dates)
- DELETE: Soft delete production

**File**: `apps/web/src/app/api/productions/[id]/stages/route.ts`
- GET: List stages for production
- POST: Create new stage

**File**: `apps/web/src/app/api/stages/[id]/route.ts`
- PATCH: Update stage (move status)
- DELETE: Delete stage

### 2. API Client

**File**: `apps/web/src/lib/api/productions.ts`
- `ProductionApiClient` class following `ProjectApiClient` pattern
- Methods: `getProductions()`, `getProduction()`, `createProduction()`, `updateProduction()`, `deleteProduction()`
- Stage methods: `getStages()`, `createStage()`, `updateStage()`, `deleteStage()`

**File**: `apps/web/src/lib/api/types.ts` - Add types:
- `ProductionData`, `ProductionStageData`
- `ProductionCreateInput`, `ProductionUpdateInput`
- `ProductionStageCreateInput`, `ProductionStageUpdateInput`

### 3. UI Components

**File**: `apps/web/src/components/projects/create-production-modal.tsx`
- Dialog modal following `CreateProjectModal` pattern
- Fields: type (PLATE/COUNTERTOP), plannedStartDate, plannedEndDate, notes
- Creates production and auto-creates initial stages

**File**: `apps/web/src/components/projects/production-list.tsx`
- Card-based list showing all productions for project
- Each production card shows: type badge, status, progress bar, stage indicators
- Actions: edit, delete (with confirmation)

**File**: `apps/web/src/components/projects/production-detail-card.tsx`
- Expandable card showing production details
- Stages list with color-coded status indicators
- Progress bar (0-100%)
- Quick action buttons (start, complete, move status)

**File**: `apps/web/src/components/projects/stage-selector.tsx`
- Component to manage production stages
- Checkbox list for pre-defined stages
- Ability to add custom stages

### 4. Project Detail Page Integration

**File**: `apps/web/src/app/projects/[id]/page.tsx` - Add section:
- "Производство" section after "Этапы проекта"
- Shows list of productions with `ProductionList` component
- "Добавить производство" button triggers `CreateProductionModal`
- Each production expandable to show stages

### 5. Standard Production Stages (to auto-create)

Based on production workflow for stone materials:
1. **ЗАКАЗ_МАТЕРИАЛОВ** - Заказ материалов у поставщиков
2. **ПОСТУПЛЕНИЕ** - Поступление материалов на склад
3. **РАСКРОЙ** - Раскрой плит/столешниц
4. **ПОЛИРОВКА** - Полировка и обработка кромок
5. **КОНТРОЛЬ_КАЧЕСТВА** - Контроль качества
6. **УПАКОВКА** - Упаковка для транспортировки
7. **ДОСТАВКА** - Доставка на объект
8. **МОНТАЖ** - Монтаж на адресе заказчика

Status values: `pending`, `active`, `completed`, `blocked`

### 6. Production Types

Enum values for `type` field (stored in `attributes.type` since no explicit type field in schema):
- **PLATE**: Плитные материалы
- **COUNTERTOP**: Столешницы

## Natural Seams / Task Breakdown

1. **API Routes** - Create `/api/productions` endpoints (independent work)
2. **API Client + Types** - Add `productions.ts` and update `types.ts` (depends on API routes)
3. **Create Production Modal** - Build modal component (independent, can mock API)
4. **Production List Component** - Build list display (depends on types, can mock data)
5. **Production Detail Card** - Build expandable detail view (depends on list)
6. **Stage Management** - Stage CRUD components (independent)
7. **Project Detail Integration** - Add production section to project detail (depends on all above)

## Verification Plan

1. Create production via modal on project detail page
2. Verify production appears in list with correct type badge
3. Expand production to see auto-created stages
4. Move stage status via UI
5. Verify production progress updates
6. Start/complete production workflow
7. Delete production and verify soft delete

## Risks

- **unique projectId constraint**: Only 1 production per project in schema - need to verify if this is correct requirement or if multiple productions should be allowed
- **type field**: Schema has no explicit `type` field - needs to be stored in `attributes` JSON field
- **stage auto-creation**: Need to define which stages are standard vs custom per production type
