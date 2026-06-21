"""
Pydantic settings for application configuration.

Validates environment variables for PostgreSQL and RabbitMQ connections.
Uses asyncpg driver for async PostgreSQL queries.
"""
from functools import lru_cache
from typing import Literal

from pydantic import Field, ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "unified-crm-worker"
    app_version: str = "0.1.0"
    environment: Literal["development", "production", "test"] = "development"
    log_level: str = "INFO"

    # Server
    host: str = "0.0.0.0"
    port: int = 8001

    # PostgreSQL - using asyncpg driver
    # Format: postgresql+asyncpg://user:password@host:port/database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@postgres:5432/unified_crm",
        description="PostgreSQL connection URL with asyncpg driver",
    )

    # RabbitMQ
    # Format: amqp://user:password@host:port/vhost
    rabbitmq_url: str = Field(
        default="amqp://guest:guest@rabbitmq:5672/",
        description="RabbitMQ connection URL for aio-pika",
    )

    # JWT (shared with web app for verification)
    jwt_secret: str = Field(
        default="change-me-in-production",
        description="JWT secret key (must match web app)",
    )

    # Web app URL for callbacks
    web_app_url: str = Field(
        default="http://localhost:3000",
        description="Base URL of the Next.js web app",
    )

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str, info: ValidationInfo) -> str:
        """Ensure database_url uses asyncpg driver."""
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "database_url must use asyncpg driver: postgresql+asyncpg://..."
            )
        return v

    @field_validator("rabbitmq_url")
    @classmethod
    def validate_rabbitmq_url(cls, v: str, info: ValidationInfo) -> str:
        """Ensure rabbitmq_url is a valid AMQP URL."""
        if not v.startswith("amqp://") and not v.startswith("amqps://"):
            raise ValueError("rabbitmq_url must start with amqp:// or amqps://")
        return v

    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, v: str, info: ValidationInfo) -> str:
        """Ensure jwt_secret is not default in production."""
        if info.data.get("environment") == "production" and v == "change-me-in-production":
            raise ValueError("jwt_secret must be set in production")
        return v


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()
