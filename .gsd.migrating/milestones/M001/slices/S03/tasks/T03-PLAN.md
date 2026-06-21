---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T03: Create NextAuth API route handler

Create apps/web/src/app/api/auth/[...nextauth]/route.ts exporting the NextAuth handler for /api/auth/* endpoints.

## Inputs

- `apps/web/src/lib/auth.ts`

## Expected Output

- `apps/web/src/app/api/auth/[...nextauth]/route.ts`

## Verification

test -f apps/web/src/app/api/auth/[...nextauth]/route.ts

## Observability Impact

API auth errors logged
