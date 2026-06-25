---
id: T02
parent: S06
milestone: M001
key_files:
  - .github/workflows/ci.yml
  - apps/worker/requirements.txt
key_decisions: []
duration: 
verification_result: passed
completed_at: 2026-06-21T03:42:42.048Z
blocker_discovered: false
---

# T02: Created GitHub Actions CI workflow with ruff lint job and pytest test job with coverage reporting

**Created GitHub Actions CI workflow with ruff lint job and pytest test job with coverage reporting**

## What Happened

Created .github/workflows/ci.yml with two parallel jobs: lint (ruff check apps/worker/) and test (pytest with coverage via pytest-cov). Workflow triggers on push/PR to main branch. Added pytest-cov>=5.0.0 to requirements.txt for coverage reporting. Both jobs use Python 3.12 with pip caching for faster runs. Coverage uploaded to Codecov as optional step (fail_ci_if_error: false). Each job has timeout-minutes to prevent resource exhaustion.

## Verification

Verified YAML syntax is valid via Python yaml.safe_load(). Verified pytest-cov exists in requirements.txt. Verified .github/workflows/ci.yml file exists. All task verification commands passed: test -f .github/workflows/ci.yml && test -f apps/worker/requirements.txt && grep -q pytest-cov apps/worker/requirements.txt

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` | 0 | pass | 350ms |
| 2 | `grep -q pytest-cov apps/worker/requirements.txt` | 0 | pass | 50ms |
| 3 | `test -f .github/workflows/ci.yml && test -f apps/worker/requirements.txt && grep -q pytest-cov apps/worker/requirements.txt` | 0 | pass | 60ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `.github/workflows/ci.yml`
- `apps/worker/requirements.txt`
