---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T04: Create login page with credentials form

Create apps/web/src/app/login/page.tsx with Client Component form. Form submits to /api/auth/callback/credentials.

## Inputs

- `apps/web/src/app/api/auth/[...nextauth]/route.ts`

## Expected Output

- `apps/web/src/app/login/page.tsx`
- `apps/web/src/components/login-form.tsx`

## Verification

test -f apps/web/src/app/login/page.tsx && test -f apps/web/src/components/login-form.tsx

## Observability Impact

Login failures logged
