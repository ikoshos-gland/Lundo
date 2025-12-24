"""FastAPI application entry point for Child Behavioral Therapist system."""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Application lifespan manager."""
    # Startup
    logger.info(f"Starting {settings.app_name} in {settings.app_env} mode")

    # Initialize database connection pool
    # TODO: Initialize database

    # Initialize Redis connection
    # TODO: Initialize Redis

    # Initialize vector store
    # TODO: Initialize Chroma

    # Initialize LangSmith tracing
    if settings.langsmith_tracing and settings.langsmith_api_key:
        import os
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = settings.langsmith_api_key
        os.environ["LANGCHAIN_PROJECT"] = settings.langsmith_project
        logger.info("LangSmith tracing enabled")

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.app_name}")
    # TODO: Close database connections
    # TODO: Close Redis connections


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="Multi-agent child behavioral therapist system using LangChain",
    version=settings.api_version,
    debug=settings.debug,
    lifespan=lifespan,
    docs_url=f"/api/{settings.api_version}/docs",
    redoc_url=f"/api/{settings.api_version}/redoc",
    openapi_url=f"/api/{settings.api_version}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.api_version,
        "environment": settings.app_env
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Child Behavioral Therapist API",
        "version": settings.api_version,
        "docs": f"/api/{settings.api_version}/docs"
    }


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.debug else "An error occurred"
        }
    )


# Import and include routers
from app.api.v1 import auth, children, conversations, memories, interrupts

app.include_router(
    auth.router,
    prefix=f"/api/{settings.api_version}/auth",
    tags=["Authentication"]
)
app.include_router(
    children.router,
    prefix=f"/api/{settings.api_version}/children",
    tags=["Children"]
)
app.include_router(
    conversations.router,
    prefix=f"/api/{settings.api_version}/conversations",
    tags=["Conversations"]
)
app.include_router(
    memories.router,
    prefix=f"/api/{settings.api_version}/memories",
    tags=["Memories & Insights"]
)
app.include_router(
    interrupts.router,
    prefix=f"/api/{settings.api_version}/interrupts",
    tags=["Human-in-the-Loop"]
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8080,
        reload=settings.debug
    )
