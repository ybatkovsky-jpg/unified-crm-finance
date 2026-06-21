---
estimated_steps: 6
estimated_files: 1
skills_used: []
---

# T04: Create docker-compose.yml and verify all services start

**Slice:** S01 — Монорепозиторий и Docker Compose
**Milestone:** M001

## Description

Wire all services (postgres, rabbitmq, minio, web, worker) in docker-compose.yml with networks, volumes, and health checks. This is the integration that makes the full environment runnable with one command.

## Steps

1. Create `docker-compose.yml` with services: postgres (16-alpine, healthcheck pg_isready), rabbitmq (3-management, healthcheck rabbitmq-diagnostics), minio (latest, healthcheck mc ready), web (build from apps/web, depends_on postgres/rabbitmq/minio with condition: service_healthy, ports 3000:3000, volumes ./apps/web:/app/web for HMR), worker (build from apps/worker, depends_on postgres/rabbitmq with condition: service_healthy)
2. Create shared network 'app-network' for all services
3. Add volumes: postgres_data, rabbitmq_data, minio_data with local persistence
4. Add env_file: .env for web and worker services
5. Verify startup: `docker compose up -d` followed by `docker compose ps` shows all services as healthy
6. Verify health endpoints: curl http://localhost:3000/api/health and curl http://localhost:8000/health return 200

## Must-Haves

- [ ] docker-compose.yml with all 5 services (postgres, rabbitmq, minio, web, worker)
- [ ] Health checks configured for all services
- [ ] app-network shared network
- [ ] Named volumes for data persistence
- [ ] All services start and become healthy
- [ ] Both health endpoints return 200

## Verification

```bash
docker compose up -d --build && sleep 30 && docker compose ps | grep -q 'healthy' && curl -f http://localhost:3000/api/health && curl -f http://localhost:8000/health
```

## Observability Impact

Signals added:
- docker compose ps shows service health status
- /api/health (web) and /health (worker) endpoints for service monitoring

## Inputs

- `apps/web/Dockerfile` — required for web service build
- `apps/worker/Dockerfile` — required for worker service build
- `.env.example` — template for required environment variables

## Expected Output

- `docker-compose.yml` — orchestration of all services
