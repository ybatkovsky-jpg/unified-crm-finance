---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T07: Cascade Close Logic - Repository

Add completeWithCascade(projectId: string, userId: string) method to ProjectRepository in apps/web/src/lib/db/projects.ts. Uses Prisma transaction to: (1) set Project.status='completed' and completedAt=now(), (2) find related Deal via dealId, (3) move Deal to won stage and set closedAt=now. Validates all project stages are completed first. Returns updated Project and Deal.

## Inputs

- `apps/web/src/lib/db/projects.ts`
- `apps/web/src/lib/db/deals.ts`
- `apps/web/prisma/schema.prisma`

## Expected Output

- `apps/web/src/lib/db/projects.ts`

## Verification

grep -q 'completeWithCascade' apps/web/src/lib/db/projects.ts
