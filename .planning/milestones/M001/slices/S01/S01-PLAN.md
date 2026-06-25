# S01: Монорепозиторий и Docker Compose

**Goal:** Создать монорепозиторий с npm workspaces и Docker Compose окружением для всех сервисов (PostgreSQL, RabbitMQ, MinIO, web, worker). docker compose up поднимает все сервисы без ошибок, health endpoints на web и worker отвечают 200 с status UP.
**Demo:** docker compose up поднимает все сервисы, health на web и worker отвечает 200

## Must-Haves

- docker compose up поднимает все сервисы (postgres, rabbitmq, minio, web, worker) без ошибок
- docker compose ps показывает все сервисы со статусом healthy
- curl http://localhost:3000/api/health возвращает 200 с {status: 'UP'}
- curl http://localhost:8000/health возвращает 200 с {status: 'UP'}
- apps/web/src/app/page.tsx рендерится в браузере
- ADR-01 задокументирован в .gsd/adr/001-hybrid-architecture.md

## Proof Level

- This slice proves: operational

## Integration Closure

Upstream surfaces consumed: docs/04-tech-stack.md (tech stack specification), .gsd/milestones/M001/slices/S01/S01-RESEARCH.md (architectural findings). New wiring introduced: npm workspaces configuration linking apps/web, apps/worker, packages/*; Docker Compose networks linking postgres, rabbitmq, minio, web, worker; Health endpoints on both web and worker for downstream monitoring.

## Verification

- Runtime signals: health endpoints return {status: 'UP', services: {db, rabbitmq, minio}}. Inspection surfaces: docker compose ps (service health status), curl http://localhost:3000/api/health, curl http://localhost:8000/health. Failure visibility: health checks fail in docker compose ps if services don't start, health endpoints return non-UP status.

## Tasks

- [x] **T01: Create npm workspace root structure** `est:15m`
  Create the root package.json with npm workspaces configuration, .env.example with all required environment variables, and basic directory structure (apps/web, apps/worker, packages/types). This is the foundation that enables apps/*/ package.json files to resolve dependencies correctly.
  - Files: `package.json`, `.env.example`, `.dockerignore`, `apps/web/.gitkeep`, `apps/worker/.gitkeep`, `packages/types/.gitkeep`
  - Verify: test -f package.json && test -f .env.example && test -d apps/web && test -d apps/worker && test -d packages/types && npm install 2>&1 | grep -q 'added'

- [x] **T02: Create apps/web Next.js skeleton with Dockerfile** `est:30m`
  Initialize Next.js 16 app with minimal configuration and multi-stage Dockerfile. The Dockerfile enables both dev (with volume mounts for HMR) and prod (standalone output) builds.
  - Files: `apps/web/package.json`, `apps/web/next.config.ts`, `apps/web/tsconfig.json`, `apps/web/Dockerfile`, `apps/web/.dockerignore`, `apps/web/src/app/page.tsx`, `apps/web/src/app/api/health/route.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`
  - Verify: test -f apps/web/package.json && test -f apps/web/Dockerfile && test -f apps/web/src/app/page.tsx && test -f apps/web/src/app/api/health/route.ts && cd apps/web && npm install 2>&1 | grep -q 'added'

- [x] **T03: Create apps/worker FastAPI skeleton with Dockerfile** `est:25m`
  Initialize Python FastAPI worker with health endpoint and multi-stage Dockerfile. The worker will later handle background tasks (AI, email, parsing) but for S01 only needs a /health endpoint.
  - Files: `apps/worker/requirements.txt`, `apps/worker/Dockerfile`, `apps/worker/.dockerignore`, `apps/worker/app/main.py`, `apps/worker/app/__init__.py`
  - Verify: test -f apps/worker/requirements.txt && test -f apps/worker/Dockerfile && test -f apps/worker/app/main.py && grep -q 'FastAPI' apps/worker/requirements.txt && grep -q '/health' apps/worker/app/main.py

- [x] **T04: Create docker-compose.yml and verify all services start** `est:30m`
  Wire all services (postgres, rabbitmq, minio, web, worker) in docker-compose.yml with networks, volumes, and health checks. This is the integration that makes the full environment runnable with one command.
  - Files: `docker-compose.yml`
  - Verify: docker compose up -d --build && sleep 30 && docker compose ps | grep -q 'healthy' && curl -f http://localhost:3000/api/health && curl -f http://localhost:8000/health

- [x] **T05: Create ADR-01 documenting hybrid architecture** `est:15m`
  Document the decision to use hybrid Next.js API Routes + Python FastAPI architecture. This ADR captures the rationale per requirement R008.
  - Files: `.gsd/adr/001-hybrid-architecture.md`
  - Verify: test -f .gsd/adr/001-hybrid-architecture.md && grep -q 'Context' .gsd/adr/001-hybrid-architecture.md && grep -q 'Decision' .gsd/adr/001-hybrid-architecture.md && grep -q 'Rationale' .gsd/adr/001-hybrid-architecture.md

## Files Likely Touched

- package.json
- .env.example
- .dockerignore
- apps/web/.gitkeep
- apps/worker/.gitkeep
- packages/types/.gitkeep
- apps/web/package.json
- apps/web/next.config.ts
- apps/web/tsconfig.json
- apps/web/Dockerfile
- apps/web/.dockerignore
- apps/web/src/app/page.tsx
- apps/web/src/app/api/health/route.ts
- apps/web/src/app/layout.tsx
- apps/web/src/app/globals.css
- apps/worker/requirements.txt
- apps/worker/Dockerfile
- apps/worker/.dockerignore
- apps/worker/app/main.py
- apps/worker/app/__init__.py
- docker-compose.yml
- .gsd/adr/001-hybrid-architecture.md
