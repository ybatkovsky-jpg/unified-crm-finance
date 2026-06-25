# S03 — Research

**Date:** 2026-06-20

## Summary

S03 implements NextAuth v5 authentication with Credentials provider and JWT strategy for Next.js 16 App Router. The implementation includes `/login` page with form, NextAuth configuration at `apps/web/src/lib/auth.ts`, JWT helper utilities for token generation/validation, and auth middleware for protected routes using `@/lib/next-auth/middleware.ts`. NextAuth v5 (`auth.js`) is the current version and provides App Router-compatible authentication with type-safe session management.

The primary recommendation is to use **Credentials provider with JWT strategy** rather than OAuth providers for M001. This validates the auth flow without external dependencies, and OAuth can be added later. JWT tokens are stored in httpOnly cookies (secure by default) and contain minimal user data (user ID, email, role). The auth middleware redirects unauthenticated users to `/login` and sets session cookies on successful login.

Implementation depends on S01 (Docker Compose infrastructure) and S02 (Prisma User model). NextAuth reads from the same PostgreSQL database via Prisma Client, ensuring type-safe user queries.

## Recommendation

Use **NextAuth v5 (`auth.js`)** with Credentials provider for M001. Configure `/apps/web/src/lib/auth.ts` as the NextAuth configuration module, export `auth` from it, and use `auth.ts` for both App Router auth (via `auth` export) and API routes (via `getToken()`). Use httpOnly cookies for JWT storage (NextAuth default) rather than localStorage for security. Implement `/login` page as a Server Component with a Client Component form for credentials submission.

Auth middleware should use `@/lib/next-auth/middleware.ts` to protect routes under `/dashboard/*`. Middleware extracts JWT from cookies, validates with NextAuth `auth()` function, and redirects to `/login` if invalid. This pattern provides automatic session refresh and handles token expiration gracefully.

## Implementation Landscape

### Key Files

- `apps/web/src/lib/auth.ts` — NextAuth configuration with Credentials provider, JWT strategy, and Prisma adapter
- `apps/web/src/app/login/page.tsx` — Login page with credentials form (Server Component wrapper, Client Component form)
- `apps/web/src/lib/next-auth/middleware.ts` — Auth middleware protecting `/dashboard/*` routes
- `apps/web/src/lib/auth/config.ts` — Auth config (NEXTAUTH_SECRET, JWT signing options)
- `apps/web/src/app/api/auth/[...nextauth]/route.ts` — NextAuth API route handler (App Router pattern)
- `apps/web/src/app/api/auth/login/route.ts` — Custom login endpoint validating credentials and issuing JWT
- `apps/web/.env.example` — Add NEXTAUTH_SECRET, NEXTAUTH_URL env vars

### Build Order

1. **Install NextAuth dependencies** — `npm install next-auth@beta auth@beta` (NextAuth v5 is in beta as of 2026)
2. **Create `apps/web/src/lib/auth.ts`** — Configure Credentials provider with Prisma User model
3. **Add env vars to `.env.example`** — `NEXTAUTH_SECRET`, `NEXTAUTH_URL=http://localhost:3000`
4. **Create `/apps/web/src/app/api/auth/[...nextauth]/route.ts`** — Export NextAuth handler for App Router
5. **Create `/apps/web/src/app/login/page.tsx`** — Login form with username/password fields
6. **Create `/apps/web/src/lib/next-auth/middleware.ts`** — Protect `/dashboard/*` routes
7. **Add JWT helper utilities** — `getToken()` wrapper for API routes, `verifyToken()` for custom validation
8. **Update `apps/web/next.config.ts`** — Add middleware matcher for `/dashboard/*` routes

### Verification Approach

- Navigate to `/login` — page renders with username/password form
- Submit invalid credentials — error message displays, no redirect
- Submit valid credentials (from Prisma seed or manual insert) — redirect to `/`, session cookie set
- Navigate to `/dashboard` while authenticated — page renders
- Navigate to `/dashboard` while not authenticated — redirect to `/login`
- Call `/api/auth/session` API endpoint — returns JSON with user data if authenticated, `null` if not
- Check browser DevTools Application tab — httpOnly cookie named `next-auth.session-token` (or `authjs.session-token` in v5) present after login

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Session management | NextAuth httpOnly cookies | Secure by default, CSRF protection built-in, automatic token refresh |
| Password hashing | bcrypt (via `bcryptjs` for edge compatibility) | Battle-tested, adaptive hashing, widely adopted |
| JWT validation | NextAuth `getToken()` helper | Handles cookie parsing, signature verification, expiration automatically |
| Credentials validation | Prisma `findUnique()` on User model | Type-safe query, returns `null` if user not found, enforces unique email |
| Route protection | NextAuth middleware pattern | Automatic redirect logic, session refresh, edge runtime compatible |

## Constraints

- **NextAuth v5 (beta) required** — Next.js 16 App Router needs NextAuth v5 (`next-auth@beta`), not v4
- **Prisma User model must exist** — S02 must complete before S03; NextAuth Credentials provider queries Prisma
- **httpOnly cookies required** — Cannot use localStorage for JWT storage (security constraint for M001)
- **Edge runtime compatibility** — NextAuth middleware runs on edge runtime; avoid Node-only APIs in middleware
- **Credentials provider only** — M001 validates basic auth flow; OAuth providers (Google, GitHub) deferred to later

## Common Pitfalls

- **Using NextAuth v4 patterns in v5** — Configuration and exports differ. Use `auth.ts` module export, not `NextAuth()` function directly.
- **Forgetting `NEXTAUTH_SECRET`** — JWT signing fails silently. Set in `.env` before running Next.js.
- **Middleware protecting `/`** — Don't protect root route with auth middleware; creates redirect loops. Protect only `/dashboard/*`.
- **Client Component login form without Server wrapper** — Form must submit to API route; Server Component wrapper provides CSRF protection.
- **Prisma Client not generated** — Run `npx prisma generate` after S02 migrations; NextAuth can't query without types.

## Open Risks

- **NextAuth v5 beta stability** — NextAuth v5 is in beta as of 2026-06; API changes possible. Mitigated by App Router requirement (v4 incompatible).
- **Prisma User model changes** — If S02 User model evolves after S03, NextAuth Credentials provider may break. Keep User.email and User.passwordHash stable.
- **Edge runtime middleware limits** — Middleware can't access Node APIs; database queries must happen in API routes, not middleware.
- **JWT token size** — Large JWT payloads exceed cookie size limits (4KB). Keep session data minimal (user ID, email, role only).

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| NextAuth | `next-auth/skills@next-auth-setup` | available (8.2K installs) |
| NextAuth + Credentials | `next-auth/skills@credentials-provider` | available (3.1K installs) |
| JWT auth | `auth0/skills@jwt-authentication` | available (1.2K installs) |

## Sources

- NextAuth v5 Documentation (source: [Auth.js Docs](https://authjs.dev/))
- NextAuth Credentials Provider (source: [Auth.js Credentials Guide](https://authjs.dev/reference/providers/credentials))
- Next.js App Router + NextAuth (source: [NextAuth App Router Example](https://authjs.dev/reference/nextjs))
- JWT Best Practices (source: [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html))
- Prisma + NextAuth Integration (source: [Prisma NextAuth Example](https://github.com/prisma/prisma-examples/tree/latest/typescript/rest-nextjs-api-rs-auth))
