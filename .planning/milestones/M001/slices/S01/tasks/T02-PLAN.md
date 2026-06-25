---
estimated_steps: 7
estimated_files: 6
skills_used: []
---

# T02: Create apps/web Next.js skeleton with Dockerfile

**Slice:** S01 — Монорепозиторий и Docker Compose
**Milestone:** M001

## Description

Initialize Next.js 16 app with minimal configuration and multi-stage Dockerfile. The Dockerfile enables both dev (with volume mounts for HMR) and prod (standalone output) builds.

## Steps

1. Create `apps/web/package.json` with Next.js 16, React 19, TypeScript dependencies
2. Create `next.config.ts` with output: 'standalone' for prod, experimental.turbo for dev
3. Create `tsconfig.json` with strict mode and workspace paths alias (@/$/*)
4. Create minimal `src/app/page.tsx` with 'Welcome to Unified CRM' text
5. Create `src/app/api/health/route.ts` with /api/health endpoint returning {status: 'UP', services: {db: 'up', rabbitmq: 'up', minio: 'up'}} (mock for now)
6. Create Dockerfile with multi-stage: base (node:22-alpine) -> deps -> builder -> dev (with CMD npm run dev) and prod (with standalone output)
7. Create .dockerignore for node_modules, .next, .gsd

## Must-Haves

- [ ] apps/web/package.json with Next.js 16, React 19, TypeScript
- [ ] next.config.ts with standalone output
- [ ] tsconfig.json with workspace paths
- [ ] src/app/page.tsx with welcome text
- [ ] src/app/api/health/route.ts with /api/health endpoint
- [ ] Multi-stage Dockerfile with dev and prod targets
- [ ] .dockerignore configured

## Verification

```bash
test -f apps/web/package.json && test -f apps/web/Dockerfile && test -f apps/web/src/app/page.tsx && test -f apps/web/src/app/api/health/route.ts && cd apps/web && npm install 2>&1 | grep -q 'added'
```

## Observability Impact

Signals added:
- /api/health endpoint returns {status: 'UP', services: {db: 'up', rabbitmq: 'up', minio: 'up'}}

## Inputs

- `package.json` — root workspaces configuration enables apps/web to resolve workspace packages
- `docs/04-tech-stack.md` — confirms Next.js 16, React 19, TypeScript stack

## Expected Output

- `apps/web/package.json` — Next.js app dependencies
- `apps/web/next.config.ts` — Next.js configuration
- `apps/web/tsconfig.json` — TypeScript configuration with workspace paths
- `apps/web/src/app/page.tsx` — minimal home page
- `apps/web/src/app/api/health/route.ts` — health check endpoint
- `apps/web/Dockerfile` — multi-stage docker build
- `apps/web/.dockerignore` — docker exclusions
