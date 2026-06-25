# S05: FastAPI worker и RabbitMQ

**Goal:** Implement FastAPI worker with real PostgreSQL connectivity (via async SQLAlchemy) and RabbitMQ consumer skeleton (via aio-pika), replacing mocked health checks from S01 with actual connection verification.
**Demo:** health отвечает 200, RabbitMQ consumer подключён

## Must-Haves

- Health endpoint returns {status: 'UP'/'DOWN', services: {db: 'connected'/'disconnected', rabbitmq: 'connected'/'disconnected'}}
- Worker container logs show 'RabbitMQ connected' on startup
- Consumer subscribes to 'notifications' queue
- PostgreSQL connectivity verified via SELECT 1

## Proof Level

- This slice proves: Running docker-compose up and calling /health endpoint returns actual service statuses

## Integration Closure

Health endpoint validates M001 infrastructure readiness; consumer skeleton proves RabbitMQ wiring for future background processing (S06+)

## Verification

- Health check logs connection status; startup logs RabbitMQ connection; consumer logs received messages

## Tasks

- [x] **T01: Create async SQLAlchemy engine and Pydantic config for PostgreSQL and RabbitMQ** `est:30m`
  This task establishes the foundational infrastructure for real database and message queue connectivity. It creates Pydantic settings for environment configuration (DATABASE_URL, RABBITMQ_URL with validation), adds asyncpg driver to requirements.txt for async PostgreSQL queries, and implements an SQLAlchemy async engine with session factory. Why: S01 mocked connections; S05 needs real connectivity verification. The async engine is required because FastAPI is async-native and sync drivers would block the event loop.
  - Files: `apps/worker/requirements.txt`, `apps/worker/app/config.py`, `apps/worker/app/db.py`
  - Verify: grep -q 'asyncpg' apps/worker/requirements.txt && test -f apps/worker/app/config.py && test -f apps/worker/app/db.py && grep -q 'create_async_engine|async_sessionmaker' apps/worker/app/db.py

- [x] **T02: Implement health checks and RabbitMQ consumer with FastAPI lifespan integration** `est:45m`
  This task replaces S01's mocked health endpoints with real connectivity verification and creates the RabbitMQ consumer skeleton. It implements async health check functions for PostgreSQL (SELECT 1 via SQLAlchemy) and RabbitMQ (aio-pika connection test), creates an aio-pika consumer class that subscribes to 'notifications' queue, and integrates everything into main.py using FastAPI's lifespan context manager for graceful startup/shutdown. Why: M001 validates infrastructure readiness; the health endpoint proves worker can connect to shared services. Consumer skeleton proves RabbitMQ wiring for future background processing.
  - Files: `apps/worker/app/health.py`, `apps/worker/app/consumer.py`, `apps/worker/app/main.py`
  - Verify: grep -q 'check_postgres|check_rabbitmq' apps/worker/app/health.py && test -f apps/worker/app/consumer.py && grep -q 'lifespan|connect_robust|notifications' apps/worker/app/main.py && grep -q 'RabbitMQ connected' apps/worker/app/main.py

## Files Likely Touched

- apps/worker/requirements.txt
- apps/worker/app/config.py
- apps/worker/app/db.py
- apps/worker/app/health.py
- apps/worker/app/consumer.py
- apps/worker/app/main.py
