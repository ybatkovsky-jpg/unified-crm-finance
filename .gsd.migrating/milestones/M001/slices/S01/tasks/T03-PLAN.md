---
estimated_steps: 5
estimated_files: 5
skills_used: []
---

# T03: Create apps/worker FastAPI skeleton with Dockerfile

**Slice:** S01 — Монорепозиторий и Docker Compose
**Milestone:** M001

## Description

Initialize Python FastAPI worker with health endpoint and multi-stage Dockerfile. The worker will later handle background tasks (AI, email, parsing) but for S01 only needs a /health endpoint.

## Steps

1. Create `apps/worker/requirements.txt` with FastAPI 0.115, uvicorn[standard], SQLAlchemy 2.0.35, httpx 0.27, celery 5.4
2. Create `apps/worker/app/main.py` with FastAPI app and /health endpoint returning {status: 'UP', services: {db: 'connected', rabbitmq: 'connected'}} (mock for now)
3. Create Dockerfile with multi-stage: base (python:3.12-slim) -> builder (pip install) -> prod with CMD gunicorn app.main:app
4. Create .dockerignore for __pycache__, .gsd, .pytest_cache
5. Create apps/worker/app/__init__.py empty file for package structure

## Must-Haves

- [ ] requirements.txt with FastAPI, uvicorn, SQLAlchemy, httpx, celery
- [ ] app/main.py with FastAPI app and /health endpoint
- [ ] Multi-stage Dockerfile with python:3.12-slim base
- [ ] .dockerignore configured
- [ ] app/__init__.py for package structure

## Verification

```bash
test -f apps/worker/requirements.txt && test -f apps/worker/Dockerfile && test -f apps/worker/app/main.py && grep -q 'FastAPI' apps/worker/requirements.txt && grep -q '/health' apps/worker/app/main.py
```

## Observability Impact

Signals added:
- /health endpoint returns {status: 'UP', services: {db: 'connected', rabbitmq: 'connected'}}

## Inputs

- `package.json` — root workspaces configuration (worker is independent but follows monorepo structure)
- `docs/04-tech-stack.md` — confirms FastAPI for worker service

## Expected Output

- `apps/worker/requirements.txt` — Python dependencies
- `apps/worker/app/main.py` — FastAPI app with health endpoint
- `apps/worker/Dockerfile` — multi-stage docker build
- `apps/worker/.dockerignore` — docker exclusions
- `apps/worker/app/__init__.py` — package marker
