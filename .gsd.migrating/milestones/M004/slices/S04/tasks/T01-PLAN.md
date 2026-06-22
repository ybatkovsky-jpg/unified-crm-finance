---
estimated_steps: 14
estimated_files: 1
skills_used: []
---

# T01: Fix API route to include Deal and Contract relations

## Why
The GET /api/projects/[id] endpoint currently includes Contact, User, ProjectStage, and ProjectMember but not Deal or Contract relations. The detail page needs these to display linked entities. Due to Prisma schema limitations (Deal.projectId has no @relation back to Project, Contract has no projectId field), we must manually fetch these relations.

## Do
1. Modify apps/web/src/app/api/projects/[id]/route.ts GET handler:
   - After fetching project with existing includes, extract dealId and contractId
   - If dealId exists, fetch Deal with Contact and Pipeline relations via prisma.deal.findUnique
   - If contractId exists, fetch Contract with Contact and Deal relations via prisma.contract.findUnique
   - Merge Deal and Contract into the response data
2. Use Prisma client directly (import from @/lib/db/prisma) for these manual queries
3. Return merged data in the same { data: project } format
4. Handle null cases (dealId/contractId may be null)

## Done when
- API returns project with deal and contract populated when IDs exist
- TypeScript types match the updated response structure

## Inputs

- `apps/web/src/app/api/projects/[id]/route.ts`
- `apps/web/src/lib/db/prisma.ts`

## Expected Output

- `apps/web/src/app/api/projects/[id]/route.ts`

## Verification

Manual review — route includes manual Deal and Contract queries using prisma client
