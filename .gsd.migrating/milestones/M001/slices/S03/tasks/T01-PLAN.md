---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Install NextAuth v5 and password hashing dependencies

Install next-auth@beta, auth@beta, bcryptjs for password hashing. This task sets up the foundation for authentication in the Next.js 16 App Router.

## Inputs

- `README.md`

## Expected Output

- `apps/web/package.json`

## Verification

grep -q 'next-auth' apps/web/package.json && grep -q 'bcryptjs' apps/web/package.json

## Observability Impact

None - dependency install only
