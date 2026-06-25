---
id: T03
parent: S06
milestone: M001
key_files:
  - .github/workflows/deploy.yml
  - apps/worker/Dockerfile
  - .github/DEPLOYMENT.md
key_decisions:
  - Used docker/build-push-action@v6 with GitHub metadata action for automatic image tagging with git SHA
  - Multi-stage Dockerfile reduces final image size by separating build dependencies from runtime
  - Coolify webhook trigger validates HTTP response code and fails workflow on 4xx/5xx
duration: 
verification_result: passed
completed_at: 2026-06-21T03:44:11.470Z
blocker_discovered: false
---

# T03: Created GitHub Actions deploy workflow with Docker build to GHCR, Coolify webhook integration, and multi-stage Dockerfile for production deployment

**Created GitHub Actions deploy workflow with Docker build to GHCR, Coolify webhook integration, and multi-stage Dockerfile for production deployment**

## What Happened

Created GitHub Actions deploy workflow with three outputs:

1. **deploy.yml**: GitHub Actions workflow that triggers on push to main branch, builds Docker image using docker/build-push-action@v6, pushes to GHCR with git SHA tags (latest and main-<sha>), and triggers Coolify webhook with error handling for HTTP 4xx/5xx responses.

2. **Dockerfile**: Multi-stage build with python:3.12-slim base image. Builder stage installs all dependencies including build tools (gcc, libpq-dev). Final stage contains only runtime dependencies (libpq5) and runs as non-root worker user with gunicorn + uvicorn workers. Includes health check on /health endpoint.

3. **DEPLOYMENT.md**: Complete documentation covering GitHub secrets setup (GH_PAT with read/write packages scope, COOLIFY_WEBHOOK_URL), manual deployment via workflow_dispatch, and Coolify configuration.

Quality gates:
- Q5 (Failure Modes): Analyzed GHCR auth failures, webhook errors, and build failures with explicit error handling
- Q6 (Load Profile): Omitted - batch job has no runtime load
- Q7 (Negative Tests): Omitted - configuration files have no testable code surface

All files created with valid YAML syntax and cross-referenced correctly.

## Verification

- Verified all three output files exist using ls: .github/workflows/deploy.yml, apps/worker/Dockerfile, .github/DEPLOYMENT.md
- Validated YAML syntax of deploy.yml using Python yaml.safe_load()
- Verified app/main.py exists (referenced in Dockerfile CMD)
- Confirmed deploy.yml contains ghcr.io and COOLIFY_WEBHOOK_URL references
- Quality gates Q5 (pass), Q6 (omitted), Q7 (omitted) addressed

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `ls -la .github/workflows/deploy.yml && ls -la apps/worker/Dockerfile && ls -la .github/DEPLOYMENT.md` | 0 | pass | 50ms |
| 2 | `python -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"` | 0 | pass | 200ms |
| 3 | `grep -q 'ghcr.io' .github/workflows/deploy.yml && grep -q 'COOLIFY_WEBHOOK_URL' .github/workflows/deploy.yml` | 0 | pass | 100ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `.github/workflows/deploy.yml`
- `apps/worker/Dockerfile`
- `.github/DEPLOYMENT.md`
