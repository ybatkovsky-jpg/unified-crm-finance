"""
SQLAlchemy engine и session — общая БД с Next.js (см. ADR-01).

Используется reflect=True, чтобы не дублировать схему:
источник правды — apps/web/prisma/schema.prisma.
"""
import os

from sqlalchemy import create_engine, MetaData, inspect
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL_SYNC = os.getenv(
    'DATABASE_URL_SYNC',
    'postgresql+psycopg2://unified:unified_password@localhost:5432/unified_crm',
)
DATABASE_URL_ASYNC = os.getenv(
    'DATABASE_URL_ASYNC',
    'postgresql+asyncpg://unified:unified_password@localhost:5432/unified_crm',
)

# Sync engine (для Celery-задач)
engine = create_engine(
    DATABASE_URL_SYNC,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# Async engine (для FastAPI-эндпоинтов)
async_engine = create_async_engine(
    DATABASE_URL_ASYNC,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = sessionmaker(
    bind=async_engine, class_=AsyncSession, expire_on_commit=False
)

# Reflect — читаем схему из БД (не создаём свои таблицы)
metadata = MetaData()
metadata.reflect(bind=engine)


def get_db():
    """Dependency для FastAPI — sync session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_connection() -> bool:
    """Проверка подключения к БД (для /internal/health)."""
    try:
        insp = inspect(engine)
        insp.get_table_names()
        return True
    except Exception:
        return False
