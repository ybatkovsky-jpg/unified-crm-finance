---
estimated_steps: 4
estimated_files: 2
skills_used: []
---

# T01: Create ProjectRepository

Create ProjectRepository class in apps/web/src/lib/db/projects.ts following DealRepository pattern. Includes: findMany (with deletedAt filter), findUnique, findByStatus, findByManager, findByContact, findByDeal, create (with randomUUID for id, manual updatedAt), update (manual updatedAt), softDelete, count, and helper methods for stages (createStage, updateStage) and members (addMember, removeMember, findMembers). Export singleton 'projects' instance.

**Why:** Need data access layer for Project entity following established patterns.

**Do:** Create apps/web/src/lib/db/projects.ts with ProjectRepository class mirroring DealRepository structure. Implement CRUD methods with proper id generation (randomUUID) and updatedAt handling. Add query methods for common filters. Include stage/member management helpers.

**Done when:** ProjectRepository class exported with all required methods, follows DealRepository pattern, passes type checking.

## Inputs

- `apps/web/prisma/schema.prisma`
- `apps/web/src/lib/db/deals.ts`

## Expected Output

- `apps/web/src/lib/db/projects.ts`

## Verification

node --test src/lib/db/projects.test.ts

## Observability Impact

Console.error in catch blocks for visibility; structured returns for caller logging
