# S06: CI CD pipeline

**Goal:** Create GitHub Actions CI/CD pipeline for the FastAPI worker with quality gates (lint, typecheck, test) and deploy workflow for Docker builds and Coolify autodeploy to VPS
**Demo:** GitHub Actions passes на push

## Must-Haves

- GitHub Actions ci.yml workflow passes on push with lint, typecheck, and test jobs for the FastAPI worker
- Python test infrastructure exists (pytest, ruff configured) with at least one smoke test for /health endpoint
- GitHub Actions deploy.yml workflow builds Docker image, pushes to GHCR, and triggers Coolify webhook on main branch
- All workflows are idempotent — re-running them produces the same result

## Requirement Impact

Q4 (Requirement Impact) evaluates R007 (CI/CD pipeline) as the primary requirement owned by S06. This slice creates GitHub Actions workflows for quality gates (lint, test) and deployment skeleton. No existing requirements are broken — R007 is being fulfilled for the first time. No re-verification needed since this is new capability. Decisions D002 (Docker Compose) and D003 (Coolify deploy) are referenced but not revisited — deploy workflow skeleton is ready for future Docker integration.

## Proof Level

- This slice proves: operational

## Integration Closure

CI/CD pipeline validates all code changes via quality gates before merge and automates deployment to production VPS on main branch. Coolify webhook triggers pull-and-restart on VPS 64.188.56.25. This slice provides the continuous verification and delivery mechanism for all subsequent development.

## Verification

- GitHub Actions UI shows workflow run status with logs for lint, typecheck, and test failures. Deploy workflow logs show Docker image SHA pushed to GHCR and Coolify webhook response. Local development uses ruff for fast feedback loops.

## Tasks

- [x] **T01: Set up Python test infrastructure with ruff and pytest** `est:45m`
  ## Why
  CI/CD requires automated quality checks. This task creates the Python testing foundation: ruff for linting/formatting (modern replacement for flake8/black/isort) and pytest with TestClient for FastAPI endpoint testing.
  - Files: `apps/worker/requirements.txt`, `apps/worker/pyproject.toml`, `apps/worker/tests/__init__.py`, `apps/worker/tests/conftest.py`, `apps/worker/tests/test_health.py`
  - Verify: test -f apps/worker/pyproject.toml && test -f apps/worker/tests/conftest.py && test -f apps/worker/tests/test_health.py && grep -q pytest apps/worker/requirements.txt && grep -q ruff apps/worker/requirements.txt

- [x] **T02: Create GitHub Actions CI workflow for quality gates** `est:30m`
  ## Why
  Automated quality checks on every push/PR prevent broken code from merging. This workflow runs lint, typecheck (via mypy stub), and test jobs in parallel for the FastAPI worker.
  - Files: `.github/workflows/ci.yml`, `apps/worker/requirements.txt`
  - Verify: test -f .github/workflows/ci.yml && test -f apps/worker/requirements.txt && grep -q pytest-cov apps/worker/requirements.txt

- [x] **T03: Create GitHub Actions deploy workflow with Coolify webhook** `est:45m`
  ## Why
  Automated deployment on main branch merge enables continuous delivery to production VPS. This workflow builds the Docker image, pushes to GitHub Container Registry (GHCR), and triggers Coolify autodeploy via webhook.
  - Files: `.github/workflows/deploy.yml`, `apps/worker/Dockerfile`, `.github/DEPLOYMENT.md`
  - Verify: test -f .github/workflows/deploy.yml && test -f apps/worker/Dockerfile && test -f .github/DEPLOYMENT.md

## Files Likely Touched

- apps/worker/requirements.txt
- apps/worker/pyproject.toml
- apps/worker/tests/__init__.py
- apps/worker/tests/conftest.py
- apps/worker/tests/test_health.py
- .github/workflows/ci.yml
- .github/workflows/deploy.yml
- apps/worker/Dockerfile
- .github/DEPLOYMENT.md
