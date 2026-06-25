# S03: NextAuth и JWT login

**Goal:** Implement NextAuth v5 authentication with Credentials provider and JWT login flow
**Demo:** Страница login рендерится, login flow работает

## Must-Haves

- Complete the planned slice outcomes.

## Verification

- Run the task and slice verification checks for this slice.

## Tasks

- [x] **T01: Install NextAuth v5 and password hashing dependencies** `est:5m`
  Install next-auth@beta, auth@beta, bcryptjs for password hashing. This task sets up the foundation for authentication in the Next.js 16 App Router.
  - Files: `package.json`
  - Verify: grep -q 'next-auth' apps/web/package.json && grep -q 'bcryptjs' apps/web/package.json

- [x] **T02: Create NextAuth configuration with Credentials provider** `est:20m`
  Create apps/web/src/lib/auth.ts with NextAuth v5 config using Credentials provider, bcrypt password verification, and JWT strategy.
  - Files: `apps/web/src/lib/auth.ts`
  - Verify: test -f apps/web/src/lib/auth.ts

- [x] **T03: Create NextAuth API route handler** `est:10m`
  Create apps/web/src/app/api/auth/[...nextauth]/route.ts exporting the NextAuth handler for /api/auth/* endpoints.
  - Files: `apps/web/src/app/api/auth/[...nextauth]/route.ts`
  - Verify: test -f apps/web/src/app/api/auth/[...nextauth]/route.ts

- [x] **T04: Create login page with credentials form** `est:25m`
  Create apps/web/src/app/login/page.tsx with Client Component form. Form submits to /api/auth/callback/credentials.
  - Files: `apps/web/src/app/login/page.tsx`, `apps/web/src/components/login-form.tsx`
  - Verify: test -f apps/web/src/app/login/page.tsx && test -f apps/web/src/components/login-form.tsx

- [x] **T05: Create auth middleware for protected routes** `est:15m`
  Create apps/web/src/middleware.ts to protect /dashboard/* routes using NextAuth auth() function.
  - Files: `apps/web/src/middleware.ts`
  - Verify: test -f apps/web/src/middleware.ts

- [x] **T06: Create protected dashboard page** `est:15m`
  Create apps/web/src/app/dashboard/page.tsx requiring authentication. Display user email and logout button.
  - Files: `apps/web/src/app/dashboard/page.tsx`
  - Verify: test -f apps/web/src/app/dashboard/page.tsx

## Files Likely Touched

- package.json
- apps/web/src/lib/auth.ts
- apps/web/src/app/api/auth/[...nextauth]/route.ts
- apps/web/src/app/login/page.tsx
- apps/web/src/components/login-form.tsx
- apps/web/src/middleware.ts
- apps/web/src/app/dashboard/page.tsx
