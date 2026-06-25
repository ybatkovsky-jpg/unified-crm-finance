# S05: FastAPI worker и RabbitMQ — UAT

**Milestone:** M001
**Written:** 2026-06-21T03:30:07.870Z

# S05: FastAPI worker и RabbitMQ — UAT

**Milestone:** M001
**Written:** 2026-06-21

## UAT Type

- UAT mode: mixed (artifact-driven + live-runtime)
- Why this mode is sufficient: S05 delivers infrastructure connectivity; code inspection proves implementation structure, runtime verification proves actual connections work

## Preconditions

- Docker Compose stack running (db, rabbitmq services from S01)
- Worker container built and running
- Environment variables set: DATABASE_URL, RABBITMQ_URL

## Smoke Test

```bash
# From project root
curl http://localhost:8002/health
```
Expected: `{"status":"UP","services":{"db":"connected","rabbitmq":"connected"}}`
Worker logs contain: "RabbitMQ connected"

## Test Cases

### 1. PostgreSQL Connectivity Verification

1. Start worker: `docker compose up worker`
2. Call health endpoint: `curl http://localhost:8002/health`
3. **Expected:** `services.db` returns `"connected"` with latency_ms populated
4. **Expected:** No "PostgreSQL connection failed" errors in worker logs

### 2. RabbitMQ Connectivity Verification

1. Ensure RabbitMQ container is running: `docker compose ps rabbitmq`
2. Check worker logs for "RabbitMQ connected" message
3. Call health endpoint: `curl http://localhost:8002/health`
4. **Expected:** `services.rabbitmq` returns `"connected"`
5. **Expected:** Consumer declares 'notifications' queue (visible in logs)

### 3. Code Structure Verification

1. Inspect `apps/worker/app/config.py` — Settings class with DATABASE_URL/RABBITMQ_URL validators
2. Inspect `apps/worker/app/db.py` — create_async_engine() with pool configuration
3. Inspect `apps/worker/app/health.py` — check_postgres() and check_rabbitmq() async functions
4. Inspect `apps/worker/app/consumer.py` — RabbitMQConsumer class with queue declaration
5. Inspect `apps/worker/app/main.py` — lifespan manager integrating db.init_db() and consumer.start()
6. **Expected:** All files present, imports resolve, no syntax errors

### 4. Graceful Shutdown

1. Start worker: `docker compose up worker`
2. Stop with SIGTERM: `docker compose stop worker`
3. **Expected:** Logs show "Closing RabbitMQ connection" and "Closing database connection"
4. **Expected:** No errors during shutdown sequence

## Edge Cases

### PostgreSQL Unavailable

1. Stop PostgreSQL container: `docker compose stop db`
2. Call health endpoint: `curl http://localhost:8002/health`
3. **Expected:** `services.db` returns `"disconnected"` with error message
4. **Expected:** Worker continues running (does not crash)

### RabbitMQ Unavailable

1. Stop RabbitMQ container: `docker compose stop rabbitmq`
2. Call health endpoint: `curl http://localhost:8002/health`
3. **Expected:** `services.rabbitmq` returns `"disconnected"` with error message
4. **Expected:** Consumer background task logs retry attempts

## Failure Signals

- Health endpoint returns 500 error or timeout
- Worker crashes on startup with ImportError or ModuleNotFoundError
- "RabbitMQ connected" message never appears in logs
- PostgreSQL/RabbitMQ status always shows "disconnected" when services are running

## Not Proven By This UAT

- Actual message processing through the consumer (no handlers registered in S05)
- Production-scale connection pooling performance
- RabbitMQ message publishing (publish_message utility exists but not exercised)

## Notes for Tester

- S05 intentionally delivers consumer skeleton only; message handlers are deferred to later slices
- Health check latency values are informational; thresholds not enforced in M001
- Consumer uses auto-restart on error; brief "disconnected" states during startup are normal
