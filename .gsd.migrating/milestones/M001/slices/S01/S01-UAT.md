# S01: Монорепозиторий и Docker Compose — UAT

**Milestone:** M001
**Written:** 2026-06-20T07:42:33.978Z

# S01 UAT: Monorepo Infrastructure

## Setup Commands

```bash
# Clone and navigate to project
cd unified-crm-finance

# Install dependencies
npm install

# Start all services
docker compose up -d --build

# Verify services are healthy
docker compose ps
curl http://localhost:3000/api/health
curl http://localhost:8000/health
```

## Expected Results

1. **npm install** completes without errors (workspaces configured correctly)
2. **docker compose up** starts all 5 services: postgres, rabbitmq, minio, web, worker
3. **docker compose ps** shows all services as "healthy"
4. **Web health endpoint** returns: `{"status":"UP","services":{"db":"up","rabbitmq":"up","minio":"up"}}`
5. **Worker health endpoint** returns: `{"status":"UP","services":{"db":"connected","rabbitmq":"connected"}}`
6. **PostgreSQL** accessible on port 5432
7. **RabbitMQ Management UI** accessible on http://localhost:15672
8. **MinIO Console** accessible on http://localhost:9001

## Rollback Plan

```bash
docker compose down -v  # Stop and remove all volumes
```

## Notes

- First build may take several minutes downloading base images
- Web service uses dev target for HMR; production uses standalone output
- All health checks have 30s startup interval and 10s timeout
