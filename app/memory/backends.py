"""Memory backend configuration for dual-layer memory system."""
import asyncio
import logging
from typing import Any, Dict, Optional, List
from langgraph.store.base import BaseStore
from langgraph.store.postgres.aio import AsyncPostgresStore
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langchain_openai import AzureOpenAIEmbeddings
from app.config import settings

logger = logging.getLogger(__name__)

# Singleton instance - will be initialized on first use
_memory_backends_instance: "MemoryBackends | None" = None


def get_memory_backends() -> "MemoryBackends":
    """Get the singleton MemoryBackends instance."""
    global _memory_backends_instance
    if _memory_backends_instance is None:
        _memory_backends_instance = MemoryBackends(settings.postgres_connection_string)
    return _memory_backends_instance


class MemoryBackends:
    """
    Memory backend manager for dual-layer memory:
    - Short-term: Conversation state (checkpointer)
    - Long-term: Persistent memories (store)
    """

    def __init__(
        self,
        database_url: str,
        use_semantic_search: bool = True,
        embeddings_model: str = "google-genai:models/text-embedding-004"
    ):
        """
        Initialize memory backends.

        Args:
            database_url: PostgreSQL connection URL
            use_semantic_search: Enable semantic search in store
            embeddings_model: Embeddings model for semantic search
        """
        self.database_url = database_url
        self.use_semantic_search = use_semantic_search
        self.embeddings_model = embeddings_model
        self._checkpointer = None
        self._store = None
        self._store_cm = None  # Store the context manager for cleanup
        self._store_lock: asyncio.Lock | None = None  # Created lazily in async context
        self._store_initialized = False

    async def get_checkpointer(self) -> AsyncPostgresSaver:
        """
        Get PostgreSQL checkpointer for short-term memory (conversation state).

        Returns:
            AsyncPostgresSaver instance
        """
        if self._checkpointer is None:
            self._checkpointer = AsyncPostgresSaver.from_conn_string(
                self.database_url
            )
            # Initialize checkpointer tables (only needed first time)
            await self._checkpointer.setup()

        return self._checkpointer

    async def get_store(self) -> BaseStore:
        """
        Get store for long-term memory (persistent across threads).

        Uses AsyncPostgresStore with semantic search for persistent storage.
        Data survives server restarts.

        Returns:
            BaseStore instance
        """
        # Fast path - already initialized
        if self._store_initialized and self._store is not None:
            return self._store

        # Create lock lazily in async context (must be in same event loop)
        if self._store_lock is None:
            self._store_lock = asyncio.Lock()

        # Acquire lock to prevent concurrent initialization
        logger.info("[MEMORY] Waiting to acquire store lock...")
        async with self._store_lock:
            logger.info("[MEMORY] Lock acquired")
            # Double-check after acquiring lock
            if self._store_initialized and self._store is not None:
                logger.info("[MEMORY] Store already initialized, returning")
                return self._store

            logger.info("[MEMORY] Initializing AsyncPostgresStore...")

            # Convert SQLAlchemy URL to libpq format for AsyncPostgresStore
            conn_string = settings.postgres_connection_string

            if self.use_semantic_search:
                # Initialize embeddings for semantic search
                # Use dimensions=1536 to stay under pgvector HNSW limit of 2000
                embeddings = AzureOpenAIEmbeddings(
                    azure_deployment=settings.azure_openai_embedding_deployment,
                    azure_endpoint=settings.azure_openai_embedding_endpoint,
                    api_key=settings.azure_openai_embedding_api_key,
                    api_version="2024-12-01-preview",
                    dimensions=1536  # Reduce from 3072 to fit HNSW index limit
                )

                # AsyncPostgresStore returns an async context manager
                # We need to enter it and store both the CM and the store
                self._store_cm = AsyncPostgresStore.from_conn_string(
                    conn_string,
                    index={
                        "embed": embeddings,
                        "dims": 1536,  # Reduced to fit pgvector HNSW limit (max 2000)
                        "fields": ["$"]  # Index all fields
                    }
                )
            else:
                # AsyncPostgresStore without semantic search
                self._store_cm = AsyncPostgresStore.from_conn_string(conn_string)

            # Enter the async context manager to get the actual store
            logger.info("[MEMORY] Entering context manager...")
            self._store = await self._store_cm.__aenter__()
            logger.info("[MEMORY] Context manager entered")

            # Setup creates required tables if they don't exist
            logger.info("[MEMORY] Running AsyncPostgresStore setup...")
            await self._store.setup()
            logger.info("[MEMORY] Setup complete")

            self._store_initialized = True
            logger.info("[MEMORY] AsyncPostgresStore initialized - memories are now persistent!")

        return self._store

    async def save_long_term_memory(
        self,
        child_id: int,
        memory_type: str,
        key: str,
        data: Dict[str, Any]
    ) -> None:
        """
        Save data to long-term memory.

        Args:
            child_id: Child's ID
            memory_type: Type of memory (e.g., 'behavioral_patterns')
            key: Unique key for this memory item
            data: Memory data to store
        """
        store = await self.get_store()
        namespace = (f"child_{child_id}", memory_type)

        await store.aput(
            namespace,
            key,
            data
        )

    async def get_long_term_memory(
        self,
        child_id: int,
        memory_type: str,
        key: str
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve specific memory item from long-term memory.

        Args:
            child_id: Child's ID
            memory_type: Type of memory to retrieve
            key: Memory item key

        Returns:
            Memory data or None if not found
        """
        store = await self.get_store()
        namespace = (f"child_{child_id}", memory_type)

        item = await store.aget(namespace, key)
        return item.value if item else None

    async def list_memories(
        self,
        child_id: int,
        memory_type: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        List all memories of a specific type for a child.

        Args:
            child_id: Child's ID
            memory_type: Type of memory
            limit: Maximum items to return

        Returns:
            List of memory items
        """
        store = await self.get_store()
        namespace = (f"child_{child_id}", memory_type)

        # Search without query returns all items in namespace
        items = await store.asearch(namespace, limit=limit)
        return [item.value for item in items]

    async def search_memories(
        self,
        child_id: int,
        query: str,
        memory_types: Optional[List[str]] = None,
        limit: int = 10,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search across memories using semantic similarity.

        Args:
            child_id: Child's ID
            query: Search query
            memory_types: List of memory types to search (None = all)
            limit: Maximum results per memory type
            filter_dict: Optional metadata filter

        Returns:
            List of matching memory items with scores
        """
        store = await self.get_store()

        # Default memory types
        types_to_search = memory_types or [
            "behavioral_patterns",
            "developmental_history",
            "successful_interventions",
            "triggers_and_responses",
            "timeline_events",
            "family_context"
        ]

        results = []
        for memory_type in types_to_search:
            namespace = (f"child_{child_id}", memory_type)

            # Perform semantic search
            items = await store.asearch(
                namespace,
                query=query,
                limit=limit,
                filter=filter_dict
            )

            for item in items:
                results.append({
                    "memory_type": memory_type,
                    "key": item.key,
                    "data": item.value,
                    "namespace": item.namespace,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at
                })

        return results

    async def delete_memory(
        self,
        child_id: int,
        memory_type: str,
        key: str
    ) -> None:
        """
        Delete a specific memory item.

        Args:
            child_id: Child's ID
            memory_type: Type of memory
            key: Memory item key
        """
        store = await self.get_store()
        namespace = (f"child_{child_id}", memory_type)
        await store.adelete(namespace, key)

    async def delete_all_child_memories(self, child_id: int) -> None:
        """
        Delete all memories for a child (GDPR compliance).

        Args:
            child_id: Child's ID
        """
        store = await self.get_store()

        memory_types = [
            "behavioral_patterns",
            "developmental_history",
            "successful_interventions",
            "triggers_and_responses",
            "timeline_events",
            "family_context"
        ]

        for memory_type in memory_types:
            namespace = (f"child_{child_id}", memory_type)
            # List all items and delete them
            items = await store.asearch(namespace, limit=1000)
            for item in items:
                await store.adelete(namespace, item.key)

    async def close(self) -> None:
        """Close all connections."""
        if self._checkpointer:
            # AsyncPostgresSaver handles cleanup automatically
            pass

        if self._store_cm:
            # Exit the async context manager to close connections
            try:
                await self._store_cm.__aexit__(None, None, None)
                logger.info("[MEMORY] AsyncPostgresStore connection closed")
            except Exception as e:
                logger.error(f"[MEMORY] Error closing store: {e}")
            finally:
                self._store = None
                self._store_cm = None
