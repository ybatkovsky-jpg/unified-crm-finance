---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T05: Create ProjectApiClient

Create ProjectApiClient class in apps/web/src/lib/api/projects.ts following DealApiClient pattern. Include: url() helper, getProjects (with DealListParams-style query), getProject, createProject, updateProject, deleteProject. Use parseApiError, parseJson, ApiClientError from shared.ts. Export singleton 'projectsApi' and convenience exports.

**Why:** API client provides typed interface for frontend to call Project API.

**Do:** Create apps/web/src/lib/api/projects.ts with ProjectApiClient class. Implement each method using fetch wrapper. Use parseApiError for error handling, parseJson for responses. Export singleton.

**Done when:** ProjectApiClient class exported with all methods, uses shared utilities, passes type checking.

## Inputs

- `apps/web/src/lib/api/shared.ts`
- `apps/web/src/lib/api/deals.ts`
- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/lib/api/projects.ts`

## Verification

test -f src/lib/api/projects.ts

## Observability Impact

ApiClientError provides structured errors; parseApiError extracts error details; console logging optional
