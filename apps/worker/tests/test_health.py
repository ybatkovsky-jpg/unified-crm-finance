"""Health check endpoint tests."""
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(async_client: AsyncClient) -> None:
    """Test root endpoint returns app info."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "unified-crm-worker"
    assert "version" in data
    assert data["status"] == "running"


@pytest.mark.asyncio
async def test_ping_endpoint(async_client: AsyncClient) -> None:
    """Test ping endpoint returns pong."""
    response = await async_client.get("/ping")
    assert response.status_code == 200
    assert response.json() == {"status": "pong"}


@pytest.mark.asyncio
async def test_health_endpoint_returns_status(async_client: AsyncClient) -> None:
    """
    Test /health endpoint returns valid response structure.

    Note: With test lifespan override, external services aren't checked.
    This test validates the response schema and basic contract.
    """
    # Mock the health check functions to avoid external dependencies
    with patch("app.main.check_postgres", new=AsyncMock()) as mock_pg, \
         patch("app.main.check_rabbitmq", new=AsyncMock()) as mock_rmq:
        from app.health import ServiceStatus

        # Setup mock returns
        mock_pg.return_value = ServiceStatus(status="connected", latency_ms=5)
        mock_rmq.return_value = ServiceStatus(status="connected", latency_ms=10)

        response = await async_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] in ["UP", "DOWN"]
        assert "services" in data
        assert "db" in data["services"]
        assert "rabbitmq" in data["services"]
        assert "version" in data


@pytest.mark.asyncio
async def test_health_endpoint_down_when_services_fail(async_client: AsyncClient) -> None:
    """Test /health returns DOWN when services are unreachable."""
    with patch("app.main.check_postgres", new=AsyncMock()) as mock_pg, \
         patch("app.main.check_rabbitmq", new=AsyncMock()) as mock_rmq:
        from app.health import ServiceStatus

        # Mock both services as failed
        mock_pg.return_value = ServiceStatus(status="error", error="Connection failed")
        mock_rmq.return_value = ServiceStatus(status="disconnected")

        response = await async_client.get("/health")

        assert response.status_code == 200  # Endpoint returns 200, status in body
        data = response.json()
        assert data["status"] == "DOWN"
        assert data["services"]["db"]["status"] == "error"
        assert data["services"]["rabbitmq"]["status"] == "disconnected"


@pytest.mark.asyncio
async def test_health_endpoint_partial_degradation(async_client: AsyncClient) -> None:
    """Test /health returns DOWN when at least one service fails."""
    with patch("app.main.check_postgres", new=AsyncMock()) as mock_pg, \
         patch("app.main.check_rabbitmq", new=AsyncMock()) as mock_rmq:
        from app.health import ServiceStatus

        # Only RabbitMQ is up
        mock_pg.return_value = ServiceStatus(status="error", error="Timeout")
        mock_rmq.return_value = ServiceStatus(status="connected", latency_ms=8)

        response = await async_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "DOWN"
        assert data["services"]["db"]["status"] == "error"
        assert data["services"]["rabbitmq"]["status"] == "connected"
