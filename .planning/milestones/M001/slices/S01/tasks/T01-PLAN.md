---
estimated_steps: 5
estimated_files: 5
skills_used: []
---

# T01: Create npm workspace root structure

**Slice:** S01 — Монорепозиторий и Docker Compose
**Milestone:** M001

## Description

Create the root package.json with npm workspaces configuration, .env.example with all required environment variables, and basic directory structure (apps/web, apps/worker, packages/types). This is the foundation that enables apps/*/ package.json files to resolve dependencies correctly.

## Steps

1. Create root `package.json` with workspaces: ["apps/*", "packages/*"]
2. Add root scripts: dev (echo 'use docker compose up'), build (echo 'use docker compose build'), docker:up, docker:down, docker:logs
3. Create `.env.example` with DATABASE_URL, RABBITMQ_URL, MINIO_ENDPOINTS, NEXTAUTH_SECRET, JWT_SECRET placeholders
4. Create directories: `apps/web`, `apps/worker`, `packages/types` with placeholder .gitkeep files
5. Create `.dockerignore` for node_modules, .git, .gsd

## Must-Haves

- [ ] Root package.json exists with workspaces configuration
- [ ] .env.example exists with all required env vars
- [ ] Directory structure created: apps/web, apps/worker, packages/types
- [ ] .dockerignore excludes node_modules, .git, .gsd

## Verification

```bash
test -f package.json && test -f .env.example && test -d apps/web && test -d apps/worker && test -d packages/types && npm install 2>&1 | grep -q 'added'
```

## Observability Impact

None - this is infrastructure setup with no runtime components.

## Inputs

- `docs/04-tech-stack.md` — tech stack specification confirming npm workspaces

## Expected Output

- `package.json` — root package.json with workspaces configuration
- `.env.example` — environment variable template
- `.dockerignore` — docker build exclusions
- `apps/web/.gitkeep` — placeholder directory
- `apps/worker/.gitkeep` — placeholder directory
- `packages/types/.gitkeep` — placeholder directory
