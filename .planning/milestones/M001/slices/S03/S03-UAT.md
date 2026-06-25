# S03: NextAuth и JWT login — UAT

**Milestone:** M001
**Written:** 2026-06-20T21:47:21.028Z

# S03: NextAuth и JWT login — UAT

**Milestone:** M001
**Written:** 2026-06-21

## UAT Type

- UAT mode: mixed (artifact-driven + live-runtime)
- Why this mode is sufficient: Authentication can be verified through code inspection (routes exist, configuration correct) and requires runtime testing for full login flow validation

## Preconditions

- Docker Compose environment running with PostgreSQL database
- Prisma migrations applied (User table exists)
- Next.js development server running on port 3000

## Smoke Test

Navigate to `/login` — page should render without errors. Attempt to access `/dashboard` without authentication — should redirect to `/login`.

## Test Cases

### 1. Login Page Renders

1. Navigate to `http://localhost:3000/login`
2. **Expected:** Login form is displayed with email and password input fields, and a submit button

### 2. Protected Route Redirect

1. Navigate to `http://localhost:3000/dashboard` (not authenticated)
2. **Expected:** Redirect to `/login` with callbackUrl parameter

### 3. Authentication Flow

1. Submit valid credentials to login form
2. **Expected:** Successful authentication redirects to `/dashboard`, session cookie is set

### 4. Dashboard Session Display

1. Access `/dashboard` while authenticated
2. **Expected:** Page displays user's email, ID, and name from session; logout button is present

### 5. Logout

1. Click logout button on dashboard
2. **Expected:** Session is cleared, redirect to `/login`

## Edge Cases

### Invalid Credentials

1. Submit incorrect email/password
2. **Expected:** Error message displayed, user remains on login page

### Missing Session

1. Session cookie expires or is removed
2. **Expected:** Middleware redirects to `/login` on next protected route access

## Failure Signals

- Login page shows 500 error
- Middleware crashes on route access
- Dashboard accessible without authentication
- Logout does not clear session

## Not Proven By This UAT

- Password strength validation (requires additional validation logic)
- Session refresh/token expiry behavior (requires runtime time-lapse testing)
- Multi-user concurrent login scenarios

## Notes for Tester

- Current implementation uses bcrypt for password verification — passwords in database must be hashed
- NextAuth v5 beta APIs may differ from stable v4 — check for breaking changes if upgrading
- Middleware currently only protects `/dashboard/*` — expand to other routes as needed
