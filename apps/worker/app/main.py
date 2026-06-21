"""
FastAPI worker application with real PostgreSQL and RabbitMQ connectivity.

Replaces mocked health checks from S01 with actual connection verification.
"""
import logging
from contextlib import asynccontextmanager
from typing import Self

from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, status

from app.config import settings, get_settings
from app.db import init_db, close_db, engine

# Configure structured logging
logging.basicConfig(
    level=settings.log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ServiceStatus(BaseModel):
    """Status of a single service."""
    status: str = Field(description="Service status: connected, disconnected, or error")
    latency_ms: int | None = Field(default=None, description="Connection latency in milliseconds")
    error: str | None = Field(default=None, description="Error message if connection failed")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(description="Overall status: UP or DOWN")
    services: dict[str, ServiceStatus] = Field(description="Status of each service")
    version: str = Field(description="Application version")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifespan manager.

    Initializes database and RabbitMQ connections on startup,
    closes them gracefully on shutdown.
    """
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")

    # Initialize database connection
    try:
        await init_db()
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

    # RabbitMQ consumer will be initialized in T02
    logger.info("RabbitMQ consumer initialization pending (T02)")

    yield

    # Cleanup on shutdown
    logger.info("Shutting down...")
    await close_db()
    logger.info("Database connection closed")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Unified CRM Finance Worker - Background processing service",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
    lifespan=lifespan,
)


@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    """Root endpoint returning app info."""
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/health", tags=["Health"])
async def health_check() -> HealthResponse:
    """
    Health check endpoint with real connection verification.

    Checks PostgreSQL and RabbitMQ connectivity, returning detailed status.
    This replaces the mocked health check from S01.
    """
    services: dict[str, ServiceStatus] = {}
    overall_status = "UP"

    # Check PostgreSQL
    try:
        import time
        start = time.time()
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        latency = int((time.time() - start) * 1000)
        services["db"] = ServiceStatus(status="connected", latency_ms=latency)
        logger.debug(f"DB health check passed: {latency}ms")
    except Exception as e:
        services["db"] = ServiceStatus(status="error", error=str(e))
        overall_status = "DOWN"
        logger.error(f"DB health check failed: {e}")

    # Check RabbitMQ (will be implemented in T02)
    # For now, report as disconnected until T02 adds consumer
    services["rabbitmq"] = ServiceStatus(
        status="disconnected",
        error="RabbitMQ consumer not yet initialized (T02)"
    )
    overall_status = "DOWN"  # Will be UP after T02

    return HealthResponse(
        status=overall_status,
        services=services,
        version=settings.app_version,
    )


@app.get("/ping", tags=["Health"])
async def ping() -> dict[str, str]:
    """Simple ping endpoint for load balancers."""
    return {"status": "pong"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower(),
    )
