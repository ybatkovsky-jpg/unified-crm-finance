---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T06: Write ProjectApiClient tests

Create API client tests in apps/web/src/lib/api/projects.test.ts. Mock fetch for each method (getProjects, getProject, createProject, updateProject, deleteProject). Test successful responses and error handling (404, 400, 500). Follow DealApiClient.test pattern with vi.fn() mocks.

**Why:** Tests verify API client correctness before UI depends on it.

**Do:** Create apps/web/src/lib/api/projects.test.ts with node:test suite. Mock fetch with vi.fn(). Test each method for success and error cases. Verify URL construction and serialization.

**Done when:** All tests pass (node --test), covering success and error paths for each method.

## Inputs

- `apps/web/src/lib/api/projects.ts`
- `apps/web/src/lib/api/deals.test.ts`

## Expected Output

- `apps/web/src/lib/api/projects.test.ts`

## Verification

node --test src/lib/api/projects.test.ts

## Observability Impact

Test assertions verify client behavior; test failures indicate incorrect API calls
