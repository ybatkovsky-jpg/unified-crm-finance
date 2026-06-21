"""
Health check functions for PostgreSQL and RabbitMQ connectivity.

Provides async functions to verify connection status and latency
for each service used by the worker.
"""
import logging
import time

from aio_pika import Connection, connect_robust
from aio_pika.exceptions import AMQPError
from sqlalchemy.ext.asyncio import AsyncEngine

from app.config import settings

logger = logging.getLogger(__name__)


class ServiceStatus:
    """Status of a single service connection."""

    def __init__(
        self,
        status: str,
        latency_ms: int | None = None,
        error: str | None = None,
    ) -> None:
        """
        Initialize service status.

        Args:
            status: Connection status (connected, disconnected, error)
            latency_ms: Connection latency in milliseconds
            error: Error message if connection failed
        """
        self.status = status
        self.latency_ms = latency_ms
        self.error = error

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON response."""
        return {
            "status": self.status,
            "latency_ms": self.latency_ms,
            "error": self.error,
        }


async def check_postgres(engine: AsyncEngine) -> ServiceStatus:
    """
    Check PostgreSQL connectivity via SQLAlchemy.

    Executes SELECT 1 to verify connection and measure latency.

    Args:
        engine: SQLAlchemy async engine

    Returns:
        ServiceStatus with connection status and latency
    """
    try:
        start = time.time()
        async with engine.begin() as conn:
            await conn.execute("SELECT 1")
        latency = int((time.time() - start) * 1000)
        logger.debug(f"PostgreSQL health check passed: {latency}ms")
        return ServiceStatus(status="connected", latency_ms=latency)
    except Exception as e:
        logger.error(f"PostgreSQL health check failed: {e}")
        return ServiceStatus(status="error", error=str(e))


async def check_rabbitmq(url: str | None = None) -> ServiceStatus:
    """
    Check RabbitMQ connectivity via aio-pika.

    Attempts to establish a connection and measure latency.

    Args:
        url: RabbitMQ AMQP URL (defaults to settings.rabbitmq_url)

    Returns:
        ServiceStatus with connection status and latency
    """
    amqp_url = url or settings.rabbitmq_url
    try:
        start = time.time()
        connection: Connection = await connect_robust(amqp_url)
        latency = int((time.time() - start) * 1000)
        await connection.close()
        logger.debug(f"RabbitMQ health check passed: {latency}ms")
        return ServiceStatus(status="connected", latency_ms=latency)
    except AMQPError as e:
        logger.error(f"RabbitMQ health check failed (AMQP): {e}")
        return ServiceStatus(status="error", error=f"AMQP error: {e}")
    except Exception as e:
        logger.error(f"RabbitMQ health check failed: {e}")
        return ServiceStatus(status="error", error=str(e))
