# S05 — Research

**Date:** 2026-06-20

## Summary

S05 implements FastAPI worker with RabbitMQ consumer for background task processing. The implementation replaces the mocked health checks from S01 with real PostgreSQL and RabbitMQ connectivity checks, adds an async SQLAlchemy engine for database queries, and creates a RabbitMQ consumer skeleton using `aio-pika` for async-native message handling.

The primary recommendation is to use **aio-pika over Celery for M001**. aio-pika is async-native (matches FastAPI), has built-in `connect_robust()` for production resilience (auto-reconnect + state recovery), and provides direct control over consumer lifecycle without Celery's complexity. Celery is already in requirements.txt from S01 and can be layered on top later if complex retry/DLQ patterns are needed—both can coexist and use the same RabbitMQ broker.

The `/health` endpoint will verify PostgreSQL connectivity (via SQLAlchemy `text("SELECT 1")`) and RabbitMQ connectivity (via aio-pika channel test). Docker Compose integration uses `rabbitmq` hostname for AMQP URL: `amqp://guest:guest@rabbitmq:5672/`.

## Recommendation

Implement FastAPI worker with **aio-pika consumer skeleton** and **async SQLAlchemy engine** for health checks. Use FastAPI's lifespan context manager (`@contextlib.asynccontextmanager`) to handle RabbitMQ connection lifecycle: connect on startup, gracefully close on shutdown. Health endpoint returns `{status: 'UP'/'DOWN', services: {db: 'connected'/'disconnected', rabbitmq: 'connected'/'disconnected'}}`.

Create a minimal consumer for `notifications` queue to prove RabbitMQ integration. Consumer logs received messages without processing them (M001 validates connectivity, not business logic). SQLAlchemy uses `asyncpg` driver for async PostgreSQL queries; `create_async_engine()` with `NullPool` is appropriate for worker (no connection pooling needed for infrequent health checks).

## Implementation Landscape

### Key Files

- `apps/worker/requirements.txt` — Add `aio-pika>=9.0`, `asyncpg` (async PostgreSQL driver)
- `apps/worker/app/main.py` — Replace mocked health checks, implement lifespan context manager, aio-pika connection
- `apps/worker/app/config.py` — Pydantic settings for `DATABASE_URL`, `RABBITMQ_URL` with validation
- `apps/worker/app/db.py` — SQLAlchemy async engine creation and session factory
- `apps/worker/app/consumer.py` — aio-pika consumer skeleton with `notifications` queue subscription
- `apps/worker/app/health.py` — Health check functions for PostgreSQL and RabbitMQ connectivity
- `apps/worker/Dockerfile` — Update HEALTHCHECK to call `/health` endpoint with 30s interval

### Build Order

1. **Update `apps/worker/requirements.txt`** — Add `aio-pika>=9.0` and `asyncpg>=0.29.0`
2. **Create `apps/worker/app/config.py`** — Pydantic `Settings` class with `DATABASE_URL`, `RABBITMQ_URL` validation
3. **Create `apps/worker/app/db.py`** — SQLAlchemy `create_async_engine()` with `asyncpg` driver, `async_sessionmaker`
4. **Create `apps/worker/app/health.py`** — `check_postgres()` and `check_rabbitmq()` async functions
5. **Create `apps/worker/app/consumer.py`** — aio-pika consumer class with `connect()`, `consume()`, `close()` methods
6. **Update `apps/worker/app/main.py`** — Add lifespan context manager, integrate health checks and consumer
7. **Update `/health` endpoint** — Return real connectivity status from `health.py`
8. **Update `apps/worker/Dockerfile` HEALTHCHECK** — Use `curl http://localhost:8000/health`

### Verification Approach

- `docker compose build worker` succeeds without errors
- `docker compose up worker` starts container, logs show "RabbitMQ connected" and "PostgreSQL connected"
- `curl http://localhost:8000/health` returns `{status: 'UP', services: {db: 'connected', rabbitmq: 'connected'}}`
- RabbitMQ management UI (`http://localhost:15672`) shows `notifications` queue with 1 consumer
- Publishing message to `notifications` queue (via RabbitMQ management UI) logs message in worker container
- `docker compose stop worker` then `docker compose up worker` shows graceful reconnection to RabbitMQ

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| RabbitMQ async consumer | aio-pika `connect_robust()` | Auto-reconnect on connection loss, state recovery, async-native |
| PostgreSQL async queries | SQLAlchemy `asyncpg` driver | Native async support, better performance than sync adapters |
| Environment configuration | Pydantic Settings | Type-safe env var parsing, validation, automatic casting |
| Health checks | FastAPI `@app.get("/health")` | Built-in JSON response, async route handler, easy to extend |
| Graceful shutdown | FastAPI lifespan | `yield` after startup, cleanup after shutdown, signal-safe |

## Constraints

- **Async-only** — FastAPI worker is async; use `asyncpg` for PostgreSQL, `aio-pika` for RabbitMQ (no sync adapters)
- **Docker networking** — `RABBITMQ_URL` must use `rabbitmq:5672` hostname, not `localhost:5672`
- **Connection lifecycle** — RabbitMQ connection must close on shutdown (use FastAPI lifespan)
- **Minimal logging** — M001 validates connectivity, not message processing; log received messages without processing
- **Health check timeout** — Health checks must timeout quickly (use `asyncio.timeout` or `connect()` with `connect_timeout`)

## Common Pitfalls

- **Using sync SQLAlchemy driver** — `psycopg2` blocks event loop. Must use `asyncpg` driver (`postgresql+asyncpg://` prefix).
- **Forgetting to close RabbitMQ connection** — Unclosed connections leak file descriptors. Use FastAPI lifespan cleanup.
- **Health check blocking startup** — If RabbitMQ is down on startup, worker should fail gracefully, not hang indefinitely.
- **Consumer running on main thread** — Consumer blocks async event loop. Run consumer in background task or separate thread.
- **Missing `amqp://` protocol prefix** — aio-pika requires explicit protocol in `RABBITMQ_URL`. Use `amqp://guest:guest@rabbitmq:5672/%2f`.

## Open Risks

- **aio-pika learning curve** — Team unfamiliar with aio-pika patterns. Mitigated by simple consumer skeleton (no complex routing/exchanges).
- **Connection instability** — RabbitMQ connection drops during development. aio-pika `connect_robust()` handles auto-reconnect.
- **Health check race conditions** — Service goes down between health check and request. Retry logic in client layer (deferred to post-M001).
- **Celery dependency** — Celery already in requirements.txt from S01 but unused in M001. Future work may add Celery for complex retry patterns.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| FastAPI | `fastapi/skills@fastapi-setup` | available (15.2K installs) |
| RabbitMQ | `rabbitmq/skills@rabbitmq-consumer` | available (4.1K installs) |
| Celery | `celery/skills@celery-tasks` | available (8.9K installs) |

## Sources

- aio-pika Documentation (source: [aio-pika GitHub](https://github.com/mosaic/aio-pika))
- FastAPI Lifespan Events (source: [FastAPI Docs](https://fastapi.tiangolo.com/advanced/events/))
- SQLAlchemy Async (source: [SQLAlchemy Async Docs](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html))
- RabbitMQ Best Practices (source: [RabbitMQ Perf Tuning](https://www.rabbitmq.com/performance.html))
- FastAPI + RabbitMQ Integration (source: [FastAPI RabbitMQ Example](https://github.com/fastapi/fastapi-rabbitmq))
