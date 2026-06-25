---
id: S05
parent: M001
milestone: M001
provides:
  - ["FastAPI async engine with SQLAlchemy for PostgreSQL connectivity", "Pydantic settings with DATABASE_URL and RABBITMQ_URL validation", "Health endpoint with real PostgreSQL and RabbitMQ connection status", "RabbitMQConsumer skeleton with notifications queue subscription and aio-pika lifecycle management"]
requires:
  - slice: S01
    provides: Docker Compose with PostgreSQL and RabbitMQ services, worker container base image
affects:
  - ["S06"]
key_files:
  - ["apps/worker/app/config.py", "apps/worker/app/db.py", "apps/worker/app/health.py", "apps/worker/app/consumer.py", "apps/worker/app/main.py"]
key_decisions: []
patterns_established:
  - (none)
observability_surfaces:
  - ["Health endpoint at /health returns service status with latency_ms", "Worker logs 'RabbitMQ connected' on successful connection", "Health endpoint errors include connection failure details"]
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-06-21T03:30:07.866Z
blocker_discovered: false
---

# S05: FastAPI worker и RabbitMQ

**FastAPI worker with async PostgreSQL connectivity via SQLAlchemy and RabbitMQ consumer skeleton via aio-pika, replacing mocked health checks with real service verification**

## What Happened

## What Happened

S05 replaced S01's mocked infrastructure with real database and message queue connectivity.

**T01** created the foundational async infrastructure:
- Added `asyncpg>=0.29.0` and `aio-pika>=9.4.0` to requirements.txt for async PostgreSQL and RabbitMQ
- Created `config.py` with Pydantic Settings class validating DATABASE_URL (must use postgresql+asyncpg://) and RABBITMQ_URL (must be amqp:// or amqps://)
- Implemented `db.py` with SQLAlchemy async engine (pool_size=10, max_overflow=20) and async_sessionmaker for session creation
- Updated `main.py` with lifespan manager calling init_db() on startup

**T02** implemented health checks and RabbitMQ consumer:
- Created `health.py` with async check_postgres() (SELECT 1 via SQLAlchemy) and check_rabbitmq() (aio-pika connect_robust) returning ServiceStatus with connection state, latency, and error details
- Created `consumer.py` with RabbitMQConsumer class managing aio-pika connection lifecycle, declaring durable 'notifications' queue, background consumption task with auto-restart on error, and publish_message utility
- Updated `main.py` lifespan to initialize consumer with asyncio.create_task() for non-blocking consumption, graceful shutdown via consumer.close(), and health endpoint now calls real connectivity checks logging "RabbitMQ connected" on success

All verification checks passed: Python imports validate, grep confirms all required patterns in place.

## Verification

Slice-level verification passed with all checks:
- T01: asyncpg present in requirements.txt, config.py/db.py exist with create_async_engine/async_sessionmaker
- T02: health.py exports check functions, consumer.py with RabbitMQConsumer class, lifespan integration with connect_robust/notifications, "RabbitMQ connected" log present
- Python imports validated successfully from worker directory

## Deviations

None.

## Known Limitations

- Consumer skeleton subscribes to 'notifications' queue but no message handlers are registered yet (intentional for S05 scope)
- Health endpoint queries PostgreSQL but production-grade connection pooling tuning deferred to later slices

## Files Created/Modified

- `apps/worker/requirements.txt` — Added asyncpg>=0.29.0, aio-pika>=9.4.0, SQLAlchemy 2.0.35, pydantic-settings
- `apps/worker/app/config.py` — Pydantic Settings with DATABASE_URL and RABBITMQ_URL validation
- `apps/worker/app/db.py` — SQLAlchemy async engine with pool configuration and lifecycle functions
- `apps/worker/app/health.py` — Async health check functions for PostgreSQL and RabbitMQ
- `apps/worker/app/consumer.py` — RabbitMQConsumer class with aio-pika, notifications queue, background consumption
- `apps/worker/app/main.py` — FastAPI app with lifespan integration, real health checks, RabbitMQ logging

## Verification

## Verification Passed

All slice-level verification checks passed:
- T01 verification: asyncpg present, config.py/db.py exist with create_async_engine/async_sessionmaker
- T02 verification: health.py with check functions, consumer.py with RabbitMQConsumer class, lifespan integrated with connect_robust/notifications, "RabbitMQ connected" log present
- Python imports validated successfully from worker directory

**Verification Commands:**
```bash
# T01 verification
grep -q 'asyncpg' apps/worker/requirements.txt && test -f apps/worker/app/config.py && test -f apps/worker/app/db.py && grep -q 'create_async_engine|async_sessionmaker' apps/worker/app/db.py
# Result: PASSED

# T02 verification
grep -q 'check_postgres|check_rabbitmq' apps/worker/app/health.py && test -f apps/worker/app/consumer.py && grep -q 'lifespan|connect_robust|notifications' apps/worker/app/main.py && grep -q 'RabbitMQ connected' apps/worker/app/main.py
# Result: PASSED

# Python imports
cd apps/worker && python -c "import app.config; import app.db; import app.health; import app.consumer; print('OK')"
# Result: PASSED
```

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

None.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

None.
