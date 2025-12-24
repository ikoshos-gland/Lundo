"""Script to seed the vector store with books, activities, and strategies."""
import asyncio
import json
import logging
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.knowledge_base.vector_store import KnowledgeBaseVectorStore
from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def load_json_file(file_path: Path) -> list:
    """Load JSON data from file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        logger.info(f"Loaded {len(data)} items from {file_path.name}")
        return data
    except FileNotFoundError:
        logger.error(f"File not found: {file_path}")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {file_path}: {e}")
        return []


async def seed_vector_store():
    """Seed the vector store with all resources."""
    logger.info("Starting vector store seeding process...")

    # Initialize vector store
    try:
        vector_store = KnowledgeBaseVectorStore()
        await vector_store.initialize()
        logger.info("Vector store initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize vector store: {e}")
        return False

    # Define resource paths
    resources_dir = Path(__file__).parent.parent / "app" / "knowledge_base" / "resources"
    books_file = resources_dir / "books.json"
    activities_file = resources_dir / "activities.json"
    strategies_file = resources_dir / "strategies.json"

    # Load data files
    logger.info("Loading resource files...")
    books = await load_json_file(books_file)
    activities = await load_json_file(activities_file)
    strategies = await load_json_file(strategies_file)

    # Counters
    success_count = 0
    error_count = 0

    # Seed books
    logger.info("Seeding books collection...")
    for book in books:
        try:
            await vector_store.add_book(book)
            success_count += 1
            logger.debug(f"Added book: {book['title']}")
        except Exception as e:
            error_count += 1
            logger.error(f"Failed to add book '{book.get('title', 'Unknown')}': {e}")

    # Seed activities
    logger.info("Seeding activities collection...")
    for activity in activities:
        try:
            await vector_store.add_activity(activity)
            success_count += 1
            logger.debug(f"Added activity: {activity['title']}")
        except Exception as e:
            error_count += 1
            logger.error(f"Failed to add activity '{activity.get('title', 'Unknown')}': {e}")

    # Seed strategies
    logger.info("Seeding strategies collection...")
    for strategy in strategies:
        try:
            await vector_store.add_strategy(strategy)
            success_count += 1
            logger.debug(f"Added strategy: {strategy['title']}")
        except Exception as e:
            error_count += 1
            logger.error(f"Failed to add strategy '{strategy.get('title', 'Unknown')}': {e}")

    # Summary
    logger.info("=" * 60)
    logger.info("Vector store seeding completed!")
    logger.info(f"Successfully added: {success_count} items")
    logger.info(f"Errors: {error_count} items")
    logger.info(f"Total books: {len(books)}")
    logger.info(f"Total activities: {len(activities)}")
    logger.info(f"Total strategies: {len(strategies)}")
    logger.info("=" * 60)

    return error_count == 0


async def verify_seeding():
    """Verify that data was seeded correctly by performing test searches."""
    logger.info("\nVerifying seeded data...")

    vector_store = KnowledgeBaseVectorStore()
    await vector_store.initialize()

    # Test searches
    test_queries = [
        {"query": "emotional regulation", "age": 5, "collection": "books"},
        {"query": "social skills", "age": 8, "collection": "activities"},
        {"query": "bedtime routine", "age": 4, "collection": "strategies"}
    ]

    logger.info("\nRunning verification searches:")
    logger.info("-" * 60)

    for test in test_queries:
        query = test["query"]
        age = test["age"]
        collection = test["collection"]

        try:
            if collection == "books":
                results = await vector_store.search_books(query, age_years=age, top_k=3)
            elif collection == "activities":
                results = await vector_store.search_activities(query, age_years=age, top_k=3)
            elif collection == "strategies":
                results = await vector_store.search_strategies(query, age_years=age, top_k=3)

            logger.info(f"\nQuery: '{query}' (age {age}, collection: {collection})")
            logger.info(f"Found {len(results)} results:")
            for i, result in enumerate(results, 1):
                title = result.get('title', 'Unknown')
                age_range = result.get('age_range', result.get('age_range_start', 'N/A'))
                logger.info(f"  {i}. {title} (Age: {age_range})")

        except Exception as e:
            logger.error(f"Search failed for '{query}': {e}")

    logger.info("-" * 60)


async def clear_vector_store():
    """Clear all collections in the vector store."""
    logger.info("Clearing vector store...")

    vector_store = KnowledgeBaseVectorStore()
    await vector_store.initialize()

    try:
        # Note: Chroma doesn't have a built-in clear all method
        # You may need to manually delete and recreate collections
        # or delete the Chroma data directory

        logger.warning("Vector store clearing not fully implemented.")
        logger.warning("To clear data, delete the Chroma persistence directory and restart.")
        logger.warning(f"Chroma directory: {settings.chroma_persist_directory}")

    except Exception as e:
        logger.error(f"Failed to clear vector store: {e}")


async def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Seed the knowledge base vector store")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear existing data before seeding"
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify seeding by running test searches"
    )
    parser.add_argument(
        "--verify-only",
        action="store_true",
        help="Only run verification without seeding"
    )

    args = parser.parse_args()

    try:
        # Clear if requested
        if args.clear:
            await clear_vector_store()

        # Seed unless verify-only
        if not args.verify_only:
            success = await seed_vector_store()
            if not success:
                logger.error("Seeding completed with errors")
                sys.exit(1)

        # Verify if requested
        if args.verify or args.verify_only:
            await verify_seeding()

        logger.info("\n✓ Script completed successfully!")

    except KeyboardInterrupt:
        logger.info("\nSeeding interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
