---
estimated_steps: 16
estimated_files: 2
skills_used: []
---

# T02: Create GitHub Actions CI workflow for quality gates

## Why
Automated quality checks on every push/PR prevent broken code from merging. This workflow runs lint, typecheck (via mypy stub), and test jobs in parallel for the FastAPI worker.

## Do
1. Create .github/workflows/ directory
2. Create .github/workflows/ci.yml with:
   - Trigger on push and pull_request
   - Jobs: lint (ruff check), test (pytest with coverage reporting)
   - Python 3.12 setup (matches S05 worker)
   - Cache pip dependencies for faster runs
   - Fail-fast strategy for lint job
3. Include ruff check apps/worker/ and pytest apps/worker/tests/ commands
4. Add pytest-cov to requirements.txt for coverage reporting

## Done when
- .github/workflows/ci.yml file exists with valid YAML syntax
- Workflow includes ruff and pytest jobs
- GitHub Actions UI shows workflow runs on push

## Inputs

- `apps/worker/requirements.txt`

## Expected Output

- `.github/workflows/ci.yml`
- `apps/worker/requirements.txt`

## Verification

test -f .github/workflows/ci.yml && test -f apps/worker/requirements.txt && grep -q pytest-cov apps/worker/requirements.txt

## Observability Impact

GitHub Actions UI provides workflow run logs showing lint errors (ruff output with file:line) and test failures (pytest traceback). Coverage reports show percentage of code tested.
