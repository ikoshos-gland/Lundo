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

    # Azure OpenAI Configuration (Chat)
    azure_openai_api_key: str = Field(default="")
    azure_openai_endpoint: str = Field(default="")
    azure_openai_deployment: str = Field(default="gpt-5.2-chat")
    azure_openai_api_version: str = Field(default="2024-12-01-preview")

    # Azure OpenAI Configuration (Embeddings)
    azure_openai_embedding_api_key: str = Field(default="")
    azure_openai_embedding_endpoint: str = Field(default="")
    azure_openai_embedding_deployment: str = Field(default="text-embedding-3-large")

    # Vector Store
    chroma_host: str = Field(default="localhost")
    chroma_port: int = Field(default=8000)
    chroma_persist_directory: str = Field(default="./data/chroma")

    # Security
    jwt_secret_key: str = Field(default="change-me-in-production")
    jwt_algorithm: str = Field(default="HS256")
    access_token_expire_minutes: int = Field(default=60)
    refresh_token_expire_days: int = Field(default=7)

    # Firebase Authentication
    firebase_credentials_path: str = Field(default="firebase-credentials.json")
    firebase_project_id: str = Field(default="")

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

    @property
    def postgres_connection_string(self) -> str:
        """
        Convert SQLAlchemy database URL to libpq-style connection string.
        
        AsyncPostgresSaver requires libpq format:
        host=localhost port=5432 dbname=mydb user=postgres password=postgres
        """
        from urllib.parse import urlparse
        
        # Parse the SQLAlchemy URL
        # Format: postgresql+asyncpg://user:password@host:port/dbname
        url = self.database_url.replace("postgresql+asyncpg://", "postgresql://")
        parsed = urlparse(url)
        
        # Build libpq connection string
        parts = []
        if parsed.hostname:
            parts.append(f"host={parsed.hostname}")
        if parsed.port:
            parts.append(f"port={parsed.port}")
        if parsed.path and parsed.path != "/":
            dbname = parsed.path.lstrip("/")
            parts.append(f"dbname={dbname}")
        if parsed.username:
            parts.append(f"user={parsed.username}")
        if parsed.password:
            parts.append(f"password={parsed.password}")
        
        return " ".join(parts)


# Global settings instance
settings = Settings()
