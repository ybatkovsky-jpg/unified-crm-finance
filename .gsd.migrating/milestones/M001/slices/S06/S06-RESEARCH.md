# S06 — Research

**Date:** 2026-06-20

## Summary

S06 implements CI/CD pipeline using GitHub Actions with quality gates (lint, typecheck, test) for both Next.js and FastAPI, Docker build stage leveraging existing Dockerfiles from S01, and deploy stage using official Coolify GitHub Marketplace action. The implementation splits into two workflows: `ci.yml` (quality gates on every push/PR) and `deploy.yml` (Docker build + Coolify deploy on main branch only).

Current state analysis shows no CI/CD infrastructure exists (no `.github/workflows/` directory), no test frameworks configured, and missing typecheck script in apps/web/package.json. Docker infrastructure from S01 is ready with multi-stage Dockerfiles supporting both dev and prod builds.

The primary recommendation is to use **ruff for Python linting/formatting** (modern, fast replacement for flake8/black/isort) and **separate workflows** for CI and deploy. CI workflow runs on all branches and pull requests, checking code quality without deploying. Deploy workflow runs only on main branch, building Docker images and triggering Coolify autodeploy to VPS 64.188.56.25.

## Recommendation

Implement **two-stage GitHub Actions**: `ci.yml` for quality gates (lint, typecheck, test) and `deploy.yml` for Docker build + Coolify deploy. Use GitHub Actions matrix strategy to run checks in parallel across web and worker jobs. Cache npm dependencies and Python packages to speed up builds. Use GitHub Container Registry (ghcr.io) for Docker images—pre-authenticated, no Docker Hub rate limits.

CI workflow should fail fast on lint errors before running expensive typecheck/test jobs. Deploy workflow should tag Docker images with git commit SHA for traceability. Coolify GitHub Marketplace action (`coolify/action@v4`) triggers autodeploy via webhook—Coolify pulls image from GHCR and restarts containers on VPS.

## Implementation Landscape

### Key Files

- `.github/workflows/ci.yml` — Quality gates workflow (lint, typecheck, test) for web and worker
- `.github/workflows/deploy.yml` — Docker build + Coolify deploy workflow (main branch only)
- `apps/web/package.json` — Add `typecheck` script: `"typecheck": "tsc --noEmit"`
- `apps/web/jest.config.js` — Jest configuration for Next.js testing (or Vitest for faster runs)
- `apps/worker/pyproject.toml` — Python project config with pytest, ruff settings
- `apps/worker/tests/test_health.py` — Smoke test for /health endpoint
- `.github/dependabot.yml` — Dependabot config for automated dependency updates (optional)

### Build Order

1. **Setup Python test infrastructure** — Add `pytest`, `pytest-asyncio`, `ruff` to `apps/worker/requirements.txt`, create `pyproject.toml`
2. **Create typecheck scripts** — Add `"typecheck": "tsc --noEmit"` to `apps/web/package.json`
3. **Write smoke tests** — `apps/web/tests/health.test.ts` for /api/health, `apps/worker/tests/test_health.py` for /health
4. **Create CI workflow** — `.github/workflows/ci.yml` with lint/typecheck/test jobs for web and worker
5. **Create deploy workflow** — `.github/workflows/deploy.yml` with Docker build, GHCR push, Coolify webhook
6. **Configure Coolify** — Add GitHub repository, set autodeploy webhook, point to VPS 64.188.56.25
7. **Test CI workflow** — Push to feature branch, verify green checkmark
8. **Test deploy workflow** — Merge to main, verify Coolify deploys to VPS

### Verification Approach

- Push code to feature branch — GitHub Actions `ci.yml` runs, all jobs pass (lint, typecheck, test)
- Open pull request — CI runs automatically, checks must pass before merge
- Merge PR to main — `deploy.yml` runs, Docker images pushed to GHCR, Coolify webhook triggered
- Check GitHub Actions tab — All workflows show green checkmark, no failures
- Check Coolify dashboard — New deployment shows "Success" status on VPS 64.188.56.25
- Curl VPS URL — Application responds, health endpoint returns `UP`
- Check GHCR — Docker images tagged with commit SHA exist

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| Python linting/formatting | ruff (replaces flake8, black, isort) | 10-100x faster, one tool instead of three, compatible configs |
| TypeScript typecheck | `tsc --noEmit` | Built into TypeScript, no extra deps, catches type errors |
| Next.js testing | Jest/Vitest with React Testing Library | Industry standard, good Next.js integration |
| FastAPI testing | pytest with TestClient | Async support, fixture system, FastAPI-native |
| Docker builds | GitHub Actions `docker/build-push-action` | Official action, GHCR integration, layer caching |
| Autodeploy | Coolify GitHub Marketplace action | Official Coolify integration, webhook-based, zero-downtime |

## Constraints

- **GitHub Actions only** — No CircleCI, Travis CI, or other platforms (project uses GitHub)
- **Coolify on VPS 64.188.56.25** — Deploy target fixed, configure Coolify webhook to this IP
- **Docker Hub limits** — Use GHCR instead of Docker Hub (no rate limits, pre-authenticated)
- **Python 3.12** — Worker uses Python 3.12; ensure CI uses same version
- **Node.js 20+** — Next.js 16 requires Node.js 20+; use `actions/setup-node@v4` with `node-version: 20`

## Common Pitfalls

- **Missing `typecheck` script** — `tsc --noEmit` not in package.json; CI job fails even if types are correct. Add script before CI runs.
- **Pytest not finding tests** — Tests must be in `tests/` directory or `test_*.py` files. Follow pytest conventions.
- **Docker build context too large** — Including `node_modules` or `.git` slows builds. Use `.dockerignore` from S01.
- **Coolify webhook timeout** — Deploy takes longer than webhook timeout. Use asynchronous webhook pattern (Coolify ACKs immediately, deploys in background).
- **Secrets in workflow logs** — Printing `DATABASE_URL` or `RABBITMQ_URL` leaks credentials. Use GitHub Secrets and `echo "::add-mask::"`.

## Open Risks

- **Coolify learning curve** — Team unfamiliar with Coolify UI and webhook configuration. Mitigated by official docs and GitHub Marketplace action examples.
- **GitHub Actions quota** — Free tier has 2000 minutes/month. Heavy workflows may exceed quota. Cache aggressively, optimize test run time.
- **Docker image size** — Multi-stage builds may still produce large images. Use `docker-slim` or alpine bases if size becomes issue.
- **Flaky tests** — Non-deterministic test failures break CI. Keep tests simple, avoid time-based assertions, use fixtures.

## Skills Discovered

| Technology | Skill | Status |
|------------|-------|--------|
| GitHub Actions | `dalestudy/skills@github-actions` | available (612 installs) |
| CI/CD Pipeline | `ailabs-393/ai-labs-claude-skills@cicd-pipeline-generator` | available (811 installs) |
| DevOps CI/CD | `miles990/claude-software-skills@devops-cicd` | available (504 installs) |

## Sources

- GitHub Actions Documentation (source: [GitHub Actions Docs](https://docs.github.com/en/actions))
- Coolify GitHub Action (source: [Coolify Marketplace](https://github.com/coolify-workflows/coolify-action))
- Ruff Documentation (source: [Ruff Docs](https://docs.astral.sh/ruff/))
- Next.js CI Patterns (source: [Next.js CI Guide](https://nextjs.org/docs/deployment/ci-cd))
- FastAPI Testing (source: [FastAPI Tests Docs](https://fastapi.tiangolo.com/tutorial/testing/))
- GitHub Container Registry (source: [GHCR Guide](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry))
