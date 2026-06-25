# S01 — Монорепозиторий и Docker Compose

**Date:** 2026-06-20
**Lane:** Research

---

## Summary

S01 создаёт инфраструктурный фундамент для M001: монорепозиторий с npm workspaces и Docker Compose окружение для локальной разработки. Это первый и unblocking slice — все последующие (S02-S06) зависят от работающего Docker окружения.

Primary recommendation: **npm workspaces (не pnpm/turbo)** для простоты. Спецификация docs/04-tech-stack.md явно указывает "npm workspaces (или pnpm/bun workspaces)" — начинаем с npm, так как это работает везде без дополнительной инфраструктуры. Монорепо будет изолировать apps/web (Next.js), apps/worker (Python), packages/ui (будущее shared UI). Docker Compose поднимёт PostgreSQL 16, RabbitMQ 3, MinIO, web контейнер (Next.js), worker контейнер (FastAPI).

Ключевое решение из архитектуры: **всё в Docker с volume mounting** для HMR (Hot Module Reload). Это обеспечивает environment parity (как в проде) и быструю разработочную обратную связь. Dockerfiles должны быть multi-stage: dev stage с volume mounts для исходников, prod stage с minimal images.

Risks: integrating Next.js + Python + RabbitMQ + PostgreSQL в одном docker-compose.yml; health endpoints на обоих контейнерах должны корректно проверять зависимые сервисы (PostgreSQL, RabbitMQ). Устраняется: стандартными healthcheck директивами и wait-for-it скриптами/объединением в depends_on с condition: service_healthy.

---

## Recommendation

**Approach:** Создать npm workspaces монорепо с apps/web (Next.js) и apps/worker (Python), затем Docker Compose для всех сервисов с multi-stage Dockerfiles.

**Why:**
1. npm workspaces нативно поддерживаются в Node.js 22 LTS (stack spec), не требуют turbo/nx для M001 масштаба
2. Docker Compose с volume mounts обеспечивает hot reload для Next.js и Python автоперезагрузку
3. Multi-stage Dockerfiles (dev/prod) следуют best practices для production-ready images
4. health checks на всех сервисах предотвращают race conditions при старте

**Build order:**
1. Root package.json с workspaces конфигурацией
2. apps/web Next.js app с Dockerfile (multi-stage)
3. apps/worker Python FastAPI с Dockerfile (multi-stage)
4. docker-compose.yml с db, rabbitmq, minio, web, worker сервисами
5. .env.example с DATABASE_URL, RABBITMQ_URL, MINIO_ENDPOINTS
6. ADR-01 documenting hybrid architecture decision

---

## Implementation Landscape

### Key Files

- `package.json` (root) — workspaces: ["apps/*", "packages/*"], scripts: dev, build, docker:up, docker:down
- `apps/web/package.json` — Next.js 16 dependencies, dev scripts
- `apps/web/Dockerfile` — multi-stage: base → deps → builder → dev/prod variants
- `apps/web/next.config.ts` — initial config with output: 'standalone' for prod
- `apps/web/tsconfig.json` — strict mode, paths for workspace packages
- `apps/worker/requirements.txt` — FastAPI 0.115, SQLAlchemy 2.0.35, Celery 5.4, httpx 0.27
- `apps/worker/Dockerfile` — multi-stage: base → builder → prod with uvicorn
- `apps/worker/main.py` — FastAPI app skeleton with /health endpoint
- `docker-compose.yml` — services: postgres, rabbitmq, minio, web, worker with networks, volumes, healthchecks
- `.env.example` — template for DATABASE_URL, RABBITMQ_URL, MINIO credentials
- `.gsd/adr/001-hybrid-architecture.md` — ADR-01 documenting Next.js API + Python worker decision

### Build Order

1. **Root workspace setup** — Create `package.json` with workspaces config. This unblocks apps/*/ package.json hoisting and shared scripts.
2. **apps/web skeleton** — Initialize Next.js 16 with minimal config. Dockerfile depends on this structure.
3. **apps/worker skeleton** — Python FastAPI with uvicorn. Dockerfile depends on this.
4. **Dockerfiles** — Multi-stage builds for both apps. Docker Compose references these.
5. **docker-compose.yml** — Wire all services with health checks. Depends on Dockerfiles and .env.example.
6. **ADR-01** — Document architecture decision after infrastructure works.

**First proof:** `docker compose up --build` completes without errors, web serves http://localhost:3000, worker serves http://localhost:8000/health → 200.

### Verification Approach

1. **Build verification:** `docker compose build` completes for web and worker without layer cache misses on unchanged code.
2. **Startup verification:** `docker compose up -d` followed by `docker compose ps` shows all services as "healthy".
3. **Health endpoints:**
   - `curl http://localhost:3000/api/health` returns 200 with `{"status":"UP","services":{"db":"up","rabbitmq":"up","minio":"up"}}`
   - `curl http://localhost:8000/health` returns 200 with `{"status":"UP","services":{"db":"connected","rabbitmq":"connected"}}`
4. **Volume mounts:** Edit apps/web/src/app/page.tsx → reflects in browser without rebuild; edit apps/worker/main.py → reloads automatically.
5. **Workspace integrity:** From root, `npm install` hoists dependencies correctly; `docker compose exec web npm run build` works inside container.

---

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Wait-for services | Docker Compose `depends_on: {condition: service_healthy}` | Native health checks, no wrapper scripts needed |
| Multi-stage builds | Next.js standalone output | Reduces image 80%, official pattern |
| Python packaging | uvicorn[standard] + gunicorn (prod) | Production ASGI server with workers |
| Volume mounting | Docker Compose volumes: ./apps/web:/app/web | Hot reload out of box |
| Environment vars | .env + docker-compose env_file | Single source of truth for locals |

---

## Constraints

- **Stack lock:** Must use Next.js 16, React 19, Python 3.12, FastAPI 0.115, PostgreSQL 16, RabbitMQ 3 per docs/04-tech-stack.md
- **No migration path:** Starting fresh, no data from zakuppro/finpro to import
- **Workspace manager:** npm workspaces (not pnpm/turbo) per specification
- **Docker only:** All services in containers, no local postgres/rabbitmq installation

---

## Common Pitfalls

- **Race conditions on startup:** Services starting before db is ready → solved with healthcheck + depends_on condition
- **Volume mount permission errors on Windows:** WSL2 Docker required; bind mounts may be slow → consider WSL2 or named volumes
- **Next.js standalone output missing assets:** Ensure public/ is copied in Dockerfile
- **Python import errors in container:** Poetry/pip vs system python → use venv in Dockerfile and clear __pycache__
- **RabbitMQ connection refused:** Management plugin not enabled → use rabbitmq:3-management image

---

## Open Risks

- **Windows Docker performance:** Bind mounts may be slower than WSL2; mitigated by ensuring WSL2 backend
- **Memory usage:** Running 5 containers (postgres, rabbitmq, minio, web, worker) may require 8GB+ RAM
- **Health check timing:** Default healthcheck intervals may cause slow startup; tune --interval and --timeout

---

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| Docker | github/awesome-copilot@multi-stage-dockerfile | available (16K installs) |
| Docker Compose | manutej/luxor-claude-marketplace@docker-compose-orchestration | available (1.8K installs) |
| Monorepo | wshobson/agents@monorepo-management | available (10.4K installs) |

Note: These are optional — standard Docker patterns are well-documented and sufficient for M001.

---

## Sources

- npm workspaces setup: [Mastering Monorepos: Organizing Component NextJS Libraries & Projects with NPM Workspaces](https://hackernoon.com/mastering-monorepos-organizing-component-nextjs-libraries-and-projects-with-npm-workspaces)
- Docker Compose with Next.js, FastAPI, PostgreSQL: [How to Develop a Full Stack Next.js, FastAPI, PostgreSQL App Using Docker](https://www.travisluong.com/how-to-develop-a-full-stack-next-js-fastapi-postgresql-app-using-docker/)
- Next.js + PostgreSQL Docker Compose (2026): [How to Set Up a Next.js + PostgreSQL + Redis Stack with Docker Compose](https://oneuptime.com/blog/post/2026-02-08-how-to-set-up-a-nextjs-postgresql-redis-stack-with-docker-compose/view)
- MinIO with Next.js: [How to use Next.js next/image with docker-compose and MinIO](https://stackoverflow.com/questions/66499754/how-to-use-next-js-next-image-with-docker-compose-and-minio-for-local-developmen)
- RabbitMQ Docker Compose: [How to Run RabbitMQ in Docker Compose](https://medium.com/@kaloyanmanev/how-to-run-rabbitmq-in-docker-compose-e5baccc3e644)
- Next.js 16 Dockerfile: [Ultimate Next.js Standalone Dockerfile Guide](https://www.buildwithmatija.com/blog/nextjs-standalone-dockerfile-guide)
- FastAPI Dockerfile (2026): [Build a Production-Ready FastAPI Backend in 2026](https://dev.to/ottoaria/build-a-production-ready-fastapi-backend-in-2026-5-templates-that-ship-in-minutes-1kfl)
- RabbitMQ in Docker (2026): [How to Use RabbitMQ with Docker](https://oneuptime.com/blog/post/2026-02-02-rabbitmq-docker/view)