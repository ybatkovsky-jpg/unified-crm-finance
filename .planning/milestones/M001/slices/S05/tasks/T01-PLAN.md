---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T01: Create async SQLAlchemy engine and Pydantic config for PostgreSQL and RabbitMQ

This task establishes the foundational infrastructure for real database and message queue connectivity. It creates Pydantic settings for environment configuration (DATABASE_URL, RABBITMQ_URL with validation), adds asyncpg driver to requirements.txt for async PostgreSQL queries, and implements an SQLAlchemy async engine with session factory. Why: S01 mocked connections; S05 needs real connectivity verification. The async engine is required because FastAPI is async-native and sync drivers would block the event loop.

## Inputs

- `S01 worker skeleton`
- `S02 Prisma schema (for reference)`

## Expected Output

- `asyncpg>=0.29.0 in requirements.txt`
- `config.py with Settings class validating DATABASE_URL and RABBITMQ_URL`
- `db.py with create_async_engine() and async_sessionmaker`

## Verification

grep -q 'asyncpg' apps/worker/requirements.txt && test -f apps/worker/app/config.py && test -f apps/worker/app/db.py && grep -q 'create_async_engine|async_sessionmaker' apps/worker/app/db.py
