---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T03: Add Project types to API types

Add Project types to apps/web/src/lib/api/types.ts. Add ProjectData (with ProjectStage, ProjectMember, manager, contact, deal, contract relations), ProjectStageData, ProjectMemberData, ProjectFilters, ProjectListParams, ProjectCreateInput, ProjectUpdateInput, ProjectStageCreateInput, ProjectMemberCreateInput. Follow existing DealData, ContactData patterns.

**Why:** Types provide type safety for API client and routes.

**Do:** Edit apps/web/src/lib/api/types.ts to add Project-related types. Mirror DealData structure with relations. Include filter/input types for API operations.

**Done when:** All Project types exported, types match Prisma schema, compilation succeeds.

## Inputs

- `apps/web/src/lib/api/types.ts`
- `apps/web/prisma/schema.prisma`
- `apps/web/src/lib/api/deals.ts`

## Expected Output

- `apps/web/src/lib/api/types.ts`

## Verification

test -f src/lib/api/types.ts

## Observability Impact

Type errors caught at compile time; runtime schema mismatches caught by tests
