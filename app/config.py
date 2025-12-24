"""Application configuration management."""
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Application
    app_name: str = Field(default="child-behavioral-therapist")
    app_env: str = Field(default="development")
    debug: bool = Field(default=True)
    secret_key: str = Field(default="change-me-in-production")
    api_version: str = Field(default="v1")
    allowed_origins: str = Field(default="http://localhost:3000,http://localhost:8000")

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/child_therapist"
    )
    redis_url: str = Field(default="redis://localhost:6379/0")

    # LLM Configuration
    google_api_key: str = Field(default="")
    langsmith_api_key: str = Field(default="")
    langsmith_project: str = Field(default="child-therapist-dev")
    langsmith_tracing: bool = Field(default=False)

    # Vector Store
    chroma_host: str = Field(default="localhost")
    chroma_port: int = Field(default=8000)
    chroma_persist_directory: str = Field(default="./data/chroma")

    # Security
    jwt_secret_key: str = Field(default="change-me-in-production")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60)
    refresh_token_expire_days: int = Field(default=7)

    # File Storage
    storage_type: str = Field(default="local")  # local or s3
    storage_path: str = Field(default="./data/uploads")
    s3_bucket: str = Field(default="")
    aws_access_key_id: str = Field(default="")
    aws_secret_access_key: str = Field(default="")
    aws_region: str = Field(default="us-east-1")

    # Monitoring
    sentry_dsn: str = Field(default="")
    sentry_environment: str = Field(default="development")

    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60)
    rate_limit_per_hour: int = Field(default=1000)

    # Celery
    celery_broker_url: str = Field(default="redis://localhost:6379/1")
    celery_result_backend: str = Field(default="redis://localhost:6379/2")

    # Logging
    log_level: str = Field(default="INFO")
    log_format: str = Field(default="json")

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    @property
    def chroma_url(self) -> str:
        """Construct Chroma URL."""
        return f"http://{self.chroma_host}:{self.chroma_port}"


# Global settings instance
settings = Settings()
