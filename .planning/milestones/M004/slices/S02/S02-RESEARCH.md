# Research: Slice S02 - Project API + Repository

## Summary

Slice S02 requires implementing the Project CRUD layer: ProjectRepository in the backend, ProjectApiClient in the frontend, and Next.js API routes. The Prisma schema for Project, ProjectStage, and ProjectMember already exists. ProductionRepository was completed in S01 and serves as a reference. The implementation should follow the established DealRepository pattern for consistency.

## Recommendation

Create ProjectRepository (`src/lib/db/projects.ts`) mirroring DealRepository structure, with methods for CRUD, softDelete, and stage management. Create ProjectApiClient (`src/lib/api/projects.ts`) following DealApiClient pattern with fetch wrapper and typed methods. Add API routes at `src/app/api/projects/` and `src/app/api/projects/[id]/`. Add ProjectData, ProjectStageData, ProjectMemberData types to `src/lib/api/types.ts`. Write unit tests for repository and API client.

## Implementation Landscape

### Key Files to Create

| File | Purpose | Pattern to Reuse |
|------|---------|------------------|
| `apps/web/src/lib/db/projects.ts` | ProjectRepository class | DealRepository structure |
| `apps/web/src/lib/db/projects.test.ts` | Repository unit tests | DealRepository tests, ProductionRepository tests |
| `apps/web/src/lib/api/projects.ts` | ProjectApiClient class | DealApiClient structure |
| `apps/web/src/lib/api/projects.test.ts` | API client tests | DealApiClient tests |
| `apps/web/src/app/api/projects/route.ts` | GET/POST /api/projects | Deal collection route |
| `apps/web/src/app/api/projects/[id]/route.ts` | GET/PATCH/DELETE /api/projects/[id] | Deal single resource route |
| `apps/web/src/lib/api/types.ts` | Add Project* types | ContactData, DealData pattern |

### Existing Schema (Prisma)

```prisma
// Project model (lines 686-728)
model Project {
  id              String            @id
  externalNumber  String            @unique
  name            String
  description     String?
  dealId          String?           @unique
  contractId      String?           @unique
  contactId       String?
  status          String            @default("lead")
  contractAmount  Float             @default(0)
  currency        String            @default("RUB")
  startDate       DateTime?
  endDate         DateTime?
  completedAt     DateTime?
  marginTarget    Float             @default(0.25)
  qualityRating   String?
  deadlineStatus  String            @default("on_track")
  managerId       String?
  attributes      Json?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime
  deletedAt       DateTime?
  // Relations: User, Contact, ProjectMember[], ProjectStage[], Production?, etc.
}

// ProjectStage model (lines 744-760)
model ProjectStage {
  id          String    @id
  projectId   String
  code        String
  name        String
  order       Int
  status      String    @default("pending")
  startDate   DateTime?
  endDate     DateTime?
  completedAt DateTime?
  assigneeId  String?
  notes       String?
  // @@unique([projectId, code])
}

// ProjectMember model (lines 730-742)
model ProjectMember {
  id        String    @id
  projectId String
  userId    String
  role      String
  joinedAt  DateTime  @default(now())
  leftAt    DateTime?
  // @@unique([projectId, userId])
}
```

### Build Order

1. **Repository**: Create `ProjectRepository` in `src/lib/db/projects.ts`
   - CRUD methods: findMany, findUnique, create, update, softDelete, count
   - Query methods: findByStatus, findByManager, findByContact, findByDeal
   - Stage methods: createStage, updateStage, moveStage (optional for S02)
   - Member methods: addMember, removeMember, findMembers (optional for S02)

2. **Repository Tests**: Create `projects.test.ts` alongside repository
   - CRUD tests with test fixtures
   - Soft-delete behavior tests
   - Count tests

3. **API Types**: Add to `src/lib/api/types.ts`
   - ProjectData (with relations)
   - ProjectStageData
   - ProjectMemberData
   - ProjectFilters, ProjectListParams
   - ProjectCreateInput, ProjectUpdateInput

4. **API Routes**: Create `src/app/api/projects/`
   - `route.ts`: GET (list with filters), POST (create)
   - `[id]/route.ts`: GET (single), PATCH (update), DELETE (soft delete)

5. **API Client**: Create `ProjectApiClient` in `src/lib/api/projects.ts`
   - getProjects, getProject, createProject, updateProject, deleteProject
   - Fetch wrapper with parseApiError, parseJson

6. **API Client Tests**: Create `projects.test.ts` alongside API client
   - Mock fetch tests for each method
   - Error handling tests

### Verification Approach

1. **Repository Tests**: Run `npx tsx --test src/lib/db/projects.test.ts`
   - Verify CRUD operations work
   - Verify soft-delete excludes from queries
   - Verify count works correctly

2. **API Tests**: Run `npx tsx --test src/lib/api/projects.test.ts`
   - Verify fetch serialization
   - Verify error handling

3. **Integration Test** (manual via curl):
   ```bash
   # Create project
   curl -X POST http://localhost:3000/api/projects \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Project","externalNumber":"TEST-001"}'
   
   # List projects
   curl http://localhost:3000/api/projects
   
   # Get single project
   curl http://localhost:3000/api/projects/[id]
   
   # Update project
   curl -X PATCH http://localhost:3000/api/projects/[id] \
     -H "Content-Type: application/json" \
     -d '{"status":"active"}'
   
   # Delete project
   curl -X DELETE http://localhost:3000/api/projects/[id]
   ```

## Don't Hand-Roll

| Feature | Use Existing |
|---------|--------------|
| Repository pattern | DealRepository (`src/lib/db/deals.ts`) |
| API client pattern | DealApiClient (`src/lib/api/deals.ts`) |
| API route structure | Deal routes (`src/app/api/deals/`) |
| Fetch utilities | ApiClientError, parseApiError, parseJson (`src/lib/api/shared.ts`) |
| Test patterns | DealRepository tests, DealApiClient tests |
| Type definitions | DealData, DealCreateInput pattern in `types.ts` |

## Constraints

- Prisma 6.6.0 (locked in package.json)
- SQLite for development (no PostgreSQL)
- Next.js 16, React 19
- TypeScript strict mode
- Soft-delete pattern (deletedAt field)
- Russian language UI (labels in Russian)

## Common Pitfalls

1. **Project number generation**: Project uses `externalNumber` (unique string), not auto-generated like Deal's `number`. Need to decide if API should auto-generate or require from client.

2. **Member unique constraint**: ProjectMember has `@@unique([projectId, userId])`. Adding duplicate member for same user+project should error gracefully.

3. **Stage code uniqueness**: ProjectStage has `@@unique([projectId, code])`. Creating duplicate stage codes for same project should error.

4. **Cascade deletes**: Project deletion cascades to ProjectStage, ProjectMember (onDelete: Cascade). Verify this works correctly in tests.

5. **include patterns**: When fetching Project with relations, use Prisma include syntax matching DealRepository patterns (include: { ProjectStage: true, ProjectMember: true, etc.}).

6. **updatedAt not auto-managed**: Project model has `updatedAt DateTime` without `@updatedAt`. Must manually set on update (like DealRepository does).

7. **id requires manual generation**: Project.id is `@id` with no @default, must use `randomUUID()` on create.

## Open Risks

- **externalNumber format**: Spec unclear on format. Use string from client for now, can add auto-generation later.
- **Stage workflow**: 8 standard stages defined in milestone but not seeded in DB. API should allow dynamic stage creation.
- **Member multi-role**: One user can have multiple roles via multiple ProjectMember records (no unique constraint on projectId+userId+role). UI needs to handle this.
- **Cascade close**: Aкт → project/deal cascade logic is S07 scope. S02 only needs basic CRUD.

## Sources

- Schema: `apps/web/prisma/schema.prisma` (Project lines 686-728, ProjectStage 744-760, ProjectMember 730-742)
- Reference repository: `apps/web/src/lib/db/deals.ts` (DealRepository pattern)
- Reference API: `apps/web/src/lib/api/deals.ts` (DealApiClient pattern)
- Reference routes: `apps/web/src/app/api/deals/route.ts`, `apps/web/src/app/api/deals/[id]/route.ts`
- Reference types: `apps/web/src/lib/api/types.ts` (DealData, DealCreateInput patterns)
- Production reference: `apps/web/src/lib/db/production.ts` (completed in S01)
- Package constraints: `apps/web/package.json` (Prisma 6.6.0, Next.js 16)
- Memory: MEM022 (Project UUID, updatedAt manual), MEM063 (multi-role members)
