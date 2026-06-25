---
id: T01
parent: S06
milestone: M001
key_files:
  - apps/worker/requirements.txt
  - apps/worker/pyproject.toml
  - apps/worker/tests/__init__.py
  - apps/worker/tests/conftest.py
  - apps/worker/tests/test_health.py
key_decisions:
  - Used httpx AsyncClient with ASGI transport for FastAPI testing instead of TestClient for better async support
  - Configured ruff to ignore ARG003 (unused pydantic validator info param) - required by pydantic API
  - Used AsyncMock.patch in tests to avoid external dependencies while validating health check logic
duration: 
verification_result: passed
completed_at: 2026-06-21T03:39:56.581Z
blocker_discovered: false
---

# T01: Added Python test infrastructure with pytest, pytest-asyncio, and ruff with 5 passing health endpoint tests and clean lint

**Added Python test infrastructure with pytest, pytest-asyncio, and ruff with 5 passing health endpoint tests and clean lint**

## What Happened

Created the Python testing foundation for the FastAPI worker:

1. **Updated requirements.txt**: Added pytest>=8.0.0, pytest-asyncio>=0.23.0, and ruff>=0.8.0
2. **Created pyproject.toml**: Configured ruff with Python 3.12 target, 100-char line length, and sensible lint rules (E, W, F, I, B, C4, UP, ARG, SIM). Configured pytest with asyncio mode, test paths, and verbose output.
3. **Created tests/__init__.py**: Empty marker file for test package
4. **Created tests/conftest.py**: Two fixtures - `async_client` using httpx ASGI transport with test lifespan override (skips DB/RabbitMQ), and `db_session` using in-memory SQLite for future integration tests
5. **Created tests/test_health.py**: 5 tests covering root endpoint, ping, health response structure, DOWN state on service failures, and partial degradation scenarios

All 5 tests pass in 0.11s using mocked services to avoid external dependencies. Ruff linting passes with clean codebase (ARG003 ignored for pydantic validator signatures).

## Verification

**Verification Results:**

1. **pip install**: pytest, pytest-asyncio, ruff, and aiosqlite installed successfully
2. **pytest apps/worker/tests/**: All 5 tests pass (test_root_endpoint, test_ping_endpoint, test_health_endpoint_returns_status, test_health_endpoint_down_when_services_fail, test_health_endpoint_partial_degradation)
3. **ruff check apps/worker/**: All checks pass with no lint errors
4. **Task plan verification command**: Confirmed pyproject.toml, conftest.py, test_health.py exist, and pytest/ruff are in requirements.txt

**Gate Assessments:**
- Q5 (Failure Modes): PASS - Test infrastructure has no external runtime dependencies
- Q6 (Load Profile): OMITTED - No runtime load dimension for local test runner  
- Q7 (Negative Tests): PASS - Tests cover service failures, partial degradation, error states

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `pytest apps/worker/tests/ -v` | 0 | PASS | 110ms |
| 2 | `ruff check apps/worker/` | 0 | PASS | 450ms |
| 3 | `test -f apps/worker/pyproject.toml && test -f apps/worker/tests/conftest.py && grep -q pytest apps/worker/requirements.txt && grep -q ruff apps/worker/requirements.txt` | 0 | PASS | 15ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/worker/requirements.txt`
- `apps/worker/pyproject.toml`
- `apps/worker/tests/__init__.py`
- `apps/worker/tests/conftest.py`
- `apps/worker/tests/test_health.py`
