---
id: T02
parent: S01
milestone: M001
key_files:
  - D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/package.json
  - D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/next.config.ts
  - D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/tsconfig.json
  - D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/src/app/page.tsx
  - D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/src/app/layout.tsx
  - D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/src/app/globals.css
  - D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/src/app/api/health/route.ts
  - D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/Dockerfile
  - D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/.dockerignore
key_decisions:
  - Removed 'experimental.turbo' from next.config.ts as Next.js 16 uses Turbopack by default with --turbo flag
  - Adjusted Dockerfile prod stage CMD to 'node server.js' with WORKDIR /app/apps/web to match workspace standalone output structure
duration: 
verification_result: passed
completed_at: 2026-06-20T07:40:06.071Z
blocker_discovered: false
---

# T02: Created Next.js 16 app with multi-stage Dockerfile (dev/prod targets), health API endpoint, and standalone build output

**Created Next.js 16 app with multi-stage Dockerfile (dev/prod targets), health API endpoint, and standalone build output**

## What Happened

Initialized Next.js 16 app skeleton in apps/web with all required configuration files:
- package.json with Next.js 16, React 19, TypeScript dependencies
- next.config.ts with output: 'standalone' for production builds
- tsconfig.json with strict mode and workspace paths alias (@/$/*)
- src/app/page.tsx with welcome page
- src/app/layout.tsx with root layout
- src/app/globals.css with minimal styles
- src/app/api/health/route.ts with /api/health endpoint returning {status: 'UP', services: {db, rabbitmq, minio}}
- Multi-stage Dockerfile with base, deps, builder, prod, and dev targets
- .dockerignore for node_modules, .next, .gsd

Build completed successfully, generating standalone output at .next/standalone/apps/web/server.js. Fixed initial config issue where 'experimental.turbo' is not valid in Next.js 16 (Turbopack is enabled by default with --turbo flag). Adjusted Dockerfile prod stage to handle workspace structure where server.js is at apps/web/server.js.

## Verification

All required files verified present (package.json, Dockerfile, page.tsx, health/route.ts). npm install completed successfully, adding Next.js 16, React 19, TypeScript, and dev dependencies. npm run build succeeded with TypeScript check passing, generating static pages and standalone output. Verified .next/standalone/apps/web/server.js exists for production deployment.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f apps/web/package.json && test -f apps/web/Dockerfile && test -f apps/web/src/app/page.tsx && test -f apps/web/src/app/api/health/route.ts` | 0 | passed | 2000ms |
| 2 | `cd apps/web && npm install` | 0 | passed | 45000ms |
| 3 | `cd apps/web && npm run build` | 0 | passed | 12000ms |
| 4 | `find apps/web/.next/standalone -name 'server.js'` | 0 | passed | 500ms |

## Deviations

["Fixed next.config.ts: removed 'experimental.turbo' which is invalid in Next.js 16", "Updated Dockerfile prod stage to set WORKDIR /app/apps/web and adjust COPY paths for workspace structure"]

## Known Issues

None.

## Files Created/Modified

- `D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/package.json`
- `D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/next.config.ts`
- `D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/tsconfig.json`
- `D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/src/app/page.tsx`
- `D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/src/app/layout.tsx`
- `D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/src/app/globals.css`
- `D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/src/app/api/health/route.ts`
- `D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/Dockerfile`
- `D:/CLAUDE/Project/unified-crm-finance/.gsd/worktrees/M001/apps/web/.dockerignore`
