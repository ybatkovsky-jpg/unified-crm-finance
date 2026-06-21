---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T02: Implement health checks and RabbitMQ consumer with FastAPI lifespan integration

This task replaces S01's mocked health endpoints with real connectivity verification and creates the RabbitMQ consumer skeleton. It implements async health check functions for PostgreSQL (SELECT 1 via SQLAlchemy) and RabbitMQ (aio-pika connection test), creates an aio-pika consumer class that subscribes to 'notifications' queue, and integrates everything into main.py using FastAPI's lifespan context manager for graceful startup/shutdown. Why: M001 validates infrastructure readiness; the health endpoint proves worker can connect to shared services. Consumer skeleton proves RabbitMQ wiring for future background processing.

## Inputs

- `T01 config.py, db.py`
- `S01 main.py (mocked health)`
- `RabbitMQ running in docker-compose`

## Expected Output

- `health.py with check_postgres() and check_rabbitmq()`
- `consumer.py with RabbitMQConsumer class`
- `main.py updated with lifespan() and real health endpoint`

## Verification

grep -q 'check_postgres|check_rabbitmq' apps/worker/app/health.py && test -f apps/worker/app/consumer.py && grep -q 'lifespan|connect_robust|notifications' apps/worker/app/main.py && grep -q 'RabbitMQ connected' apps/worker/app/main.py
