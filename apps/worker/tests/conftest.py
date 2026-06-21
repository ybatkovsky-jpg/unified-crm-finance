"""Pytest fixtures for FastAPI worker testing."""
import asyncio
from collections.abc import AsyncIterator, Generator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.main import app


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def async_client() -> AsyncIterator[AsyncClient]:
    """
    FastAPI TestClient fixture using httpx AsyncClient with ASGI transport.

    Does NOT require external database/RabbitMQ for basic endpoint tests.
    For integration tests, override lifespan with test dependencies.
    """
    # Override lifespan to skip external service initialization
    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def test_lifespan(app_instance):
        """Test lifespan that skips DB/RabbitMQ connections."""
        yield

    app.router.lifespan_context = test_lifespan

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client


@pytest.fixture
async def db_session() -> AsyncIterator[AsyncSession]:
    """
    Async database session for integration tests.

    Uses in-memory SQLite for fast, isolated testing.
    Skips actual PostgreSQL connection.
    """
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
    )
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with engine.begin():
        # Create tables from SQLAlchemy models (if any)
        # For now, worker uses automap_base, so no tables to create
        pass

    async with async_session() as session:
        yield session

    await engine.dispose()
