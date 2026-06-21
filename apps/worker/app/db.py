"""
Async SQLAlchemy engine and session factory for PostgreSQL.

Uses asyncpg driver for non-blocking database operations.
Engine is created on startup via lifespan event in main.py.
"""
from collections.abc import AsyncGenerator
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeMeta

from app.config import settings

# Async engine with connection pooling for production
engine = create_async_engine(
    settings.database_url,
    echo=settings.environment == "development",  # Log SQL in dev
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Additional connections under load
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevent accidental implicit commits
    autocommit=False,
    autoflush=False,
)


async def get_async_session() -> AsyncIterator[AsyncSession]:
    """
    Get an async database session.

    Usage in FastAPI dependency:
        async def get_db():
            async with get_async_session() as session:
                yield session
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize database connection.

    Call this on application startup to verify connectivity.
    For SQLAlchemy with automap_base (reflecting Prisma schema),
    no tables are created here - we just verify the connection.
    """
    async with engine.begin() as conn:
        # Ping the database to verify connectivity
        await conn.execute("SELECT 1")


async def close_db() -> None:
    """Close all database connections."""
    await engine.dispose()
