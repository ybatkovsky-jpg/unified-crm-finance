---
id: S06
parent: M001
milestone: M001
provides:
  - ["GitHub Actions CI workflow with lint and test quality gates", "GitHub Actions deploy workflow with Docker build to GHCR and Coolify webhook", "Production-ready Dockerfile with health checks", "pytest test infrastructure with 5 passing health endpoint tests", "ruff lint configuration for Python code quality"]
requires:
  []
affects:
  - []
key_files:
  - ["apps/worker/requirements.txt", "apps/worker/pyproject.toml", "apps/worker/tests/__init__.py", "apps/worker/tests/conftest.py", "apps/worker/tests/test_health.py", ".github/workflows/ci.yml", ".github/workflows/deploy.yml", "apps/worker/Dockerfile", ".github/DEPLOYMENT.md"]
key_decisions:
  - ["Used httpx AsyncClient with ASGI transport for FastAPI testing instead of TestClient for better async support", "Configured ruff to ignore ARG003 (unused pydantic validator info param) - required by pydantic API", "Used AsyncMock.patch in tests to avoid external dependencies while validating health check logic", "Used docker/build-push-action@v6 with GitHub metadata action for automatic image tagging with git SHA", "Multi-stage Dockerfile reduces final image size by separating build dependencies from runtime", "Coolify webhook trigger validates HTTP response code and fails workflow on 4xx/5xx"]
patterns_established:
  - ["GitHub Actions workflows use .github/workflows/ directory with .yml extension", "Quality gates run in parallel jobs for faster feedback", "Docker builds use multi-stage pattern for smaller production images", "Deployment documentation lives in .github/DEPLOYMENT.md"]
observability_surfaces:
  - ["GitHub Actions UI shows workflow run status with logs for lint, test, and deploy failures", "Deploy workflow logs show Docker image SHA pushed to GHCR and Coolify webhook response", "pytest coverage reports uploaded to GitHub/Codecov"]
drill_down_paths:
  []
duration: ""
verification_result: passed
completed_at: 2026-06-21T03:45:06.653Z
blocker_discovered: false
---

# S06: CI CD pipeline

**Created GitHub Actions CI/CD pipeline for FastAPI worker with quality gates (lint, test), Docker build to GHCR, and Coolify webhook integration for automated deployment**

## What Happened

## What Happened

S06 established the CI/CD foundation for the FastAPI worker with three completed tasks:

1. **T01 - Python Test Infrastructure**: Created pytest-based testing foundation with 5 health endpoint tests passing, ruff lint configuration for code quality, and pyproject.toml for tool settings. Used httpx AsyncClient with ASGI transport for proper async testing and mocked external dependencies.

2. **T02 - CI Workflow**: Created .github/workflows/ci.yml with two parallel quality gate jobs—lint (ruff check) and test (pytest with coverage). Both jobs run on every push/PR to main, using Python 3.12 with pip caching. Added pytest-cov for coverage reporting.

3. **T03 - Deploy Workflow**: Created .github/workflows/deploy.yml for automated deployment on main branch pushes. Builds multi-stage Docker image, pushes to GHCR with git SHA tags, and triggers Coolify webhook with error handling. Also created production-ready Dockerfile with gunicorn and health check, plus DEPLOYMENT.md documentation.

All three tasks completed successfully with verification passing. The pipeline provides continuous quality verification and automated deployment capability for all subsequent development.

## Verification

## Verification Results

All slice-level verification checks passed:

1. **CI Workflow exists and valid**: .github/workflows/ci.yml created with lint and test jobs running in parallel
2. **Deploy Workflow exists and valid**: .github/workflows/deploy.yml created with Docker build, GHCR push, and Coolify webhook
3. **Dockerfile exists**: apps/worker/Dockerfile created with multi-stage build and production configuration
4. **Deployment documentation**: .github/DEPLOYMENT.md created with GitHub secrets setup and troubleshooting guide
5. **Test infrastructure**: pytest tests pass (5/5 tests), ruff lint passes clean
6. **Dependencies updated**: requirements.txt includes pytest, pytest-asyncio, pytest-cov, ruff

Task-level verification:
- T01: All 5 tests pass in 0.11s, ruff check passes clean
- T02: YAML syntax validated, pytest-cov confirmed in requirements
- T03: All output files exist, YAML validated, deployment docs complete

## Requirements Advanced

- R007 — Created GitHub Actions workflows (ci.yml, deploy.yml), pytest test infrastructure with 5 passing tests, ruff lint configuration with clean codebase check

## Requirements Validated

- R007 — GitHub Actions workflows created at .github/workflows/ci.yml and .github/workflows/deploy.yml; pytest tests pass (5/5); ruff lint passes clean; deployment documentation complete

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

- `apps/worker/requirements.txt` — Added pytest, pytest-asyncio, pytest-cov, ruff, aiosqlite dependencies
- `apps/worker/pyproject.toml` — Created with ruff configuration (line length 100, ignore ARG003) and pytest settings (asyncio mode)
- `apps/worker/tests/__init__.py` — Empty marker file for test package
- `apps/worker/tests/conftest.py` — Created with async_client and db_session fixtures
- `apps/worker/tests/test_health.py` — Created 5 tests for root, ping, health response, service failures, partial degradation
- `.github/workflows/ci.yml` — Created CI workflow with lint (ruff) and test (pytest with coverage) jobs
- `.github/workflows/deploy.yml` — Created deploy workflow with Docker build, GHCR push, Coolify webhook trigger
- `apps/worker/Dockerfile` — Created multi-stage Dockerfile with gunicorn and health check
- `.github/DEPLOYMENT.md` — Created deployment documentation with GitHub secrets setup and troubleshooting
