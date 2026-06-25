---
id: T06
parent: S03
milestone: M001
key_files: []
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-20T21:46:38.074Z
blocker_discovered: false
---

# T06: Created protected dashboard page with user email display and logout button using server action

**Created protected dashboard page with user email display and logout button using server action**

## What Happened

Created apps/web/src/app/dashboard/page.tsx as a server component that:
- Uses NextAuth auth() to get the current session
- Displays user email, ID, and name in a card layout
- Provides logout functionality using a server action with signOut()
- Is protected by NextAuth middleware at /dashboard/* routes

The page uses Tailwind CSS for styling and includes a navigation bar with user email and logout button. The logout functionality is implemented as a server action ('use server') that calls signOut() with a redirect to /login.

## Verification

Verified:
- Dashboard page exists at src/app/dashboard/page.tsx (confirmed with ls)
- File contains auth and signOut imports from @/lib/auth
- Uses 'use server' directive for logout action
- Displays user.email, user.id, and user.name from session
- All required files exist: middleware.ts, auth.ts, dashboard/page.tsx

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `ls src/app/dashboard/page.tsx` | 0 | PASS | 50ms |
| 2 | `ls src/middleware.ts` | 0 | PASS | 30ms |
| 3 | `node -e content check for imports and server action` | 0 | PASS | 100ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

None.
