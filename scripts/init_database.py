"""Initialize database and create tables for the child behavioral therapist system."""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.database.base import Base
from app.models.user import User
from app.models.child import Child
from app.models.conversation import Conversation
from app.models.message import Message


async def init_database():
    """Initialize database and create all tables."""
    print(f"Connecting to database: {settings.database_url}")

    # Create async engine
    engine = create_async_engine(
        settings.database_url,
        echo=True,
        future=True
    )

    # Create all tables
    async with engine.begin() as conn:
        print("Creating database tables...")
        await conn.run_sync(Base.metadata.create_all)
        print("✓ All tables created successfully!")

    # Test connection
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        print("\n✓ Database connection successful!")
        print(f"✓ Tables created: {', '.join(Base.metadata.tables.keys())}")

    await engine.dispose()
    print("\n✓ Database initialization complete!")


async def init_langraph_checkpointer():
    """Initialize LangGraph checkpointer tables."""
    from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

    print("\nInitializing LangGraph checkpointer...")

    async with AsyncPostgresSaver.from_conn_string(settings.database_url) as checkpointer:
        await checkpointer.setup()
        print("✓ LangGraph checkpointer tables created!")


async def main():
    """Main initialization function."""
    try:
        # Initialize main database
        await init_database()

        # Initialize LangGraph checkpointer
        await init_langraph_checkpointer()

        print("\n" + "="*60)
        print("DATABASE INITIALIZATION COMPLETE!")
        print("="*60)
        print("\nNext steps:")
        print("1. Configure your .env file with GOOGLE_API_KEY")
        print("2. Run: python scripts/seed_resources.py")
        print("3. Start the API: python app/main.py")
        print("="*60)

    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
