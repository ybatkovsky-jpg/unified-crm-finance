# S06: CI CD pipeline — UAT

**Milestone:** M001
**Written:** 2026-06-21T03:45:06.657Z

# S06: CI/CD pipeline — UAT

**Milestone:** M001
**Written:** 2026-06-21

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: CI/CD workflows are configuration files that validate through GitHub Actions execution; local verification of file existence and YAML syntax confirms proper setup.

## Preconditions

- GitHub repository exists with Actions enabled
- GitHub secrets configured (GH_PAT, COOLIFY_WEBHOOK_URL) for deploy workflow
- Docker daemon available for local Dockerfile testing

## Smoke Test

Verify all CI/CD workflow files exist with valid YAML syntax:
- `.github/workflows/ci.yml` - CI workflow with lint and test jobs
- `.github/workflows/deploy.yml` - Deploy workflow with Docker build and webhook
- `apps/worker/Dockerfile` - Multi-stage production Docker build
- `.github/DEPLOYMENT.md` - Deployment documentation

## Test Cases

### 1. CI Workflow Configuration

1. Check `.github/workflows/ci.yml` exists
2. Verify workflow triggers on push/PR to main branch
3. **Expected:** Two jobs defined (lint, test) using Python 3.12, ruff check on apps/worker/, pytest with coverage

### 2. Deploy Workflow Configuration

1. Check `.github/workflows/deploy.yml` exists
2. Verify workflow triggers on push to main
3. **Expected:** Docker build with context apps/worker, push to ghcr.io, Coolify webhook trigger with error handling

### 3. Dockerfile Configuration

1. Check `apps/worker/Dockerfile` exists
2. **Expected:** Multi-stage build with python:3.12-slim, non-root worker user, gunicorn+uvicorn CMD, HEALTHCHECK on /health endpoint

### 4. Deployment Documentation

1. Check `.github/DEPLOYMENT.md` exists
2. **Expected:** Documentation covers GitHub secrets setup (GH_PAT, COOLIFY_WEBHOOK_URL), manual deployment, Coolify configuration, troubleshooting

### 5. Test Infrastructure

1. Check `apps/worker/tests/test_health.py` exists
2. Check `apps/worker/pyproject.toml` exists
3. **Expected:** 5 health endpoint tests, ruff configured with line length 100, pytest with asyncio mode

## Edge Cases

### Workflow Syntax Errors

1. Parse YAML files with Python yaml.safe_load()
2. **Expected:** No parsing errors, valid YAML structure

### Missing Secrets

1. Review DEPLOYMENT.md secret requirements
2. **Expected:** Clear documentation of GH_PAT (read:packages, write:packages) and COOLIFY_WEBHOOK_URL setup

## Failure Signals

- GitHub Actions UI shows workflow run with red X status
- Workflow logs contain YAML parsing errors
- Docker build fails with dependency errors
- Webhook trigger returns HTTP 4xx/5xx

## Not Proven By This UAT

- Actual GitHub Actions execution (requires repository push)
- Real Docker image build and push to GHCR (requires authentication)
- Live Coolify webhook trigger (requires running Coolify instance)

## Notes for Tester

This UAT verifies CI/CD configuration files are properly structured and documented. Actual workflow execution requires GitHub repository integration with configured secrets. The workflows are ready to run on first push to main branch after secret setup.
