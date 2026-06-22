# S02: Project API + Repository

**Goal:** Implement Project CRUD layer: ProjectRepository, ProjectApiClient, Next.js API routes, and supporting types/tests. This provides the backend foundation for project management before UI development in S03-S04.
**Demo:** ProjectRepository passes unit tests (CRUD, softDelete, count), ProjectApiClient can create/read/update/delete via curl

## Must-Haves

- ProjectRepository passes unit tests (CRUD, softDelete, count), ProjectApiClient can create/read/update/delete via curl

## Proof Level

- This slice proves: integration

## Integration Closure

Upstream: Uses Prisma schema (Project, ProjectStage, ProjectMember models already exist); Upstream: Reuses DealRepository/DealApiClient patterns from S01 (deals.ts); Upstream: Uses shared utilities (parseApiError, parseJson, ApiClientError from shared.ts); New wiring: ProjectRepository connects Prisma to application logic; New wiring: ProjectApiClient provides typed client for frontend; New wiring: API routes expose Project CRUD at /api/projects/*; Before milestone usable: S03 UI needs ProjectApiClient; S04 detail page needs full ProjectData with relations

## Verification

- Repository methods log on error (console.error in catch blocks); API routes return structured { error, message } responses; soft-delete preserves records for audit

## Tasks

- [x] **T01: Create ProjectRepository** `est:1h`
  Create ProjectRepository class in apps/web/src/lib/db/projects.ts following DealRepository pattern. Includes: findMany (with deletedAt filter), findUnique, findByStatus, findByManager, findByContact, findByDeal, create (with randomUUID for id, manual updatedAt), update (manual updatedAt), softDelete, count, and helper methods for stages (createStage, updateStage) and members (addMember, removeMember, findMembers). Export singleton 'projects' instance.
  - Files: `apps/web/src/lib/db/projects.ts`, `apps/web/prisma/schema.prisma`
  - Verify: node --test src/lib/db/projects.test.ts

- [ ] **T02: Write ProjectRepository unit tests** `est:45m`
  Create unit tests for ProjectRepository in apps/web/src/lib/db/projects.test.ts. Test CRUD operations (create, findMany, findUnique, update, softDelete), soft-delete behavior (excluded from queries), count accuracy, and query methods (findByStatus, findByManager, findByContact, findByDeal). Use test fixtures and cleanup between tests. Follow DealRepository.test pattern.
  - Files: `apps/web/src/lib/db/projects.test.ts`, `apps/web/src/lib/db/projects.ts`
  - Verify: node --test src/lib/db/projects.test.ts

- [ ] **T03: Add Project types to API types** `est:30m`
  Add Project types to apps/web/src/lib/api/types.ts. Add ProjectData (with ProjectStage, ProjectMember, manager, contact, deal, contract relations), ProjectStageData, ProjectMemberData, ProjectFilters, ProjectListParams, ProjectCreateInput, ProjectUpdateInput, ProjectStageCreateInput, ProjectMemberCreateInput. Follow existing DealData, ContactData patterns.
  - Files: `apps/web/src/lib/api/types.ts`
  - Verify: test -f src/lib/api/types.ts

- [ ] **T04: Create Project API routes** `est:1h`
  Create Project API routes. Collection endpoint at apps/web/src/app/api/projects/route.ts with GET (list with filters: status, managerId, contactId, dealId) and POST (create with validation: name, externalNumber required). Single resource at apps/web/src/app/api/projects/[id]/route.ts with GET (include stages, members, relations), PATCH (update with existence check), DELETE (soft delete). Follow deals route pattern with NextResponse.json({ data }) success and { error, message } errors.
  - Files: `apps/web/src/app/api/projects/route.ts`, `apps/web/src/app/api/projects/[id]/route.ts`, `apps/web/src/lib/db/projects.ts`
  - Verify: test -f src/app/api/projects/route.ts && test -f src/app/api/projects/[id]/route.ts

- [ ] **T05: Create ProjectApiClient** `est:45m`
  Create ProjectApiClient class in apps/web/src/lib/api/projects.ts following DealApiClient pattern. Include: url() helper, getProjects (with DealListParams-style query), getProject, createProject, updateProject, deleteProject. Use parseApiError, parseJson, ApiClientError from shared.ts. Export singleton 'projectsApi' and convenience exports.
  - Files: `apps/web/src/lib/api/projects.ts`
  - Verify: test -f src/lib/api/projects.ts

- [ ] **T06: Write ProjectApiClient tests** `est:30m`
  Create API client tests in apps/web/src/lib/api/projects.test.ts. Mock fetch for each method (getProjects, getProject, createProject, updateProject, deleteProject). Test successful responses and error handling (404, 400, 500). Follow DealApiClient.test pattern with vi.fn() mocks.
  - Files: `apps/web/src/lib/api/projects.test.ts`
  - Verify: node --test src/lib/api/projects.test.ts

## Files Likely Touched

- apps/web/src/lib/db/projects.ts
- apps/web/prisma/schema.prisma
- apps/web/src/lib/db/projects.test.ts
- apps/web/src/lib/api/types.ts
- apps/web/src/app/api/projects/route.ts
- apps/web/src/app/api/projects/[id]/route.ts
- apps/web/src/lib/api/projects.ts
- apps/web/src/lib/api/projects.test.ts
