---
estimated_steps: 12
estimated_files: 5
skills_used: []
---

# T01: Set up Python test infrastructure with ruff and pytest

## Why
CI/CD requires automated quality checks. This task creates the Python testing foundation: ruff for linting/formatting (modern replacement for flake8/black/isort) and pytest with TestClient for FastAPI endpoint testing.

## Do
1. Add pytest, pytest-asyncio, ruff to apps/worker/requirements.txt
2. Create apps/worker/pyproject.toml with [tool.ruff] and [tool.pytest.ini_options] sections
3. Create apps/worker/tests/__init__.py (empty marker file)
4. Create apps/worker/tests/conftest.py with TestClient fixture for FastAPI app
5. Create apps/worker/tests/test_health.py with smoke test for /health endpoint returning status='UP'

## Done when
- pip install -r requirements.txt succeeds (pytest and ruff installed)
- pytest apps/worker/tests/ passes with test_health test collecting and passing
- ruff check apps/worker/ passes with no lint errors

## Inputs

- `apps/worker/requirements.txt`
- `apps/worker/app/main.py`

## Expected Output

- `apps/worker/requirements.txt`
- `apps/worker/pyproject.toml`
- `apps/worker/tests/__init__.py`
- `apps/worker/tests/conftest.py`
- `apps/worker/tests/test_health.py`

## Verification

test -f apps/worker/pyproject.toml && test -f apps/worker/tests/conftest.py && test -f apps/worker/tests/test_health.py && grep -q pytest apps/worker/requirements.txt && grep -q ruff apps/worker/requirements.txt

## Observability Impact

Ruff provides fast linting feedback during development; pytest creates structured test results that CI workflows parse for pass/fail status. Test failures include traceback with file:line references for debugging.
