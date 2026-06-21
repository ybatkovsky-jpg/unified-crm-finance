"""
FastAPI worker application with real PostgreSQL and RabbitMQ connectivity.

Integrates health checks with actual connection verification and RabbitMQ consumer
managed through FastAPI lifespan for graceful startup/shutdown.
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from pydantic import BaseModel, Field

from app.config import settings
from app.consumer import RabbitMQConsumer, default_message_handler
from app.db import close_db, engine, init_db
from app.health import ServiceStatus, check_postgres, check_rabbitmq

# Configure structured logging
logging.basicConfig(
    level=settings.log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global consumer instance (managed by lifespan)
consumer: RabbitMQConsumer | None = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(description="Overall status: UP or DOWN")
    services: dict[str, dict] = Field(description="Status of each service")
    version: str = Field(description="Application version")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Initializes database and RabbitMQ consumer on startup,
    closes connections gracefully on shutdown.
    """
    global consumer

    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Environment: {settings.environment}")

    # Initialize database connection
    try:
        await init_db()
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

    # Initialize RabbitMQ consumer
    try:
        consumer = RabbitMQConsumer()
        await consumer.connect()
        logger.info("RabbitMQ connected")
        await consumer.declare_queue("notifications")
        consumer.set_message_handler(default_message_handler)

        # Start consuming in background (non-blocking)
        asyncio.create_task(consume_messages(consumer))
        logger.info("RabbitMQ consumer started, listening to 'notifications' queue")
    except Exception as e:
        logger.error(f"Failed to start RabbitMQ consumer: {e}")
        # Don't fail startup if RabbitMQ is unavailable
        # Health check will report degraded status

    yield

    # Cleanup on shutdown
    logger.info("Shutting down...")
    if consumer:
        await consumer.close()
        logger.info("RabbitMQ consumer closed")
    await close_db()
    logger.info("Database connection closed")


async def consume_messages(consumer_instance: RabbitMQConsumer) -> None:
    """
    Background task to consume messages from RabbitMQ.

    Runs indefinitely until the app shuts down. Errors are logged
    but don't crash the worker - consumption restarts after delay.

    Args:
        consumer_instance: RabbitMQConsumer instance
    """
    while True:
        try:
            await consumer_instance.start_consuming("notifications")
        except Exception as e:
            logger.error(f"Consumer error, will retry in 5s: {e}")
            await asyncio.sleep(5)


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
    Returns 200 for healthy services, 503 for degraded state.
    """
    services: dict[str, dict] = {}
    overall_status = "UP"

    # Check PostgreSQL
    pg_status: ServiceStatus = await check_postgres(engine)
    services["db"] = pg_status.to_dict()
    if pg_status.status != "connected":
        overall_status = "DOWN"

    # Check RabbitMQ
    rabbitmq_status: ServiceStatus = await check_rabbitmq()
    services["rabbitmq"] = rabbitmq_status.to_dict()
    if rabbitmq_status.status != "connected":
        overall_status = "DOWN"

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
