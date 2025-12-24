"""Memory backend configuration for dual-layer memory system."""
from typing import Any, Dict, Optional, List
from langgraph.store.memory import InMemoryStore
from langgraph.store.base import BaseStore
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langchain.embeddings import init_embeddings


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

        Uses InMemoryStore with semantic search for development.
        For production, use AsyncPostgresStore.

        Returns:
            BaseStore instance
        """
        if self._store is None:
            if self.use_semantic_search:
                # Initialize embeddings for semantic search
                embeddings = init_embeddings(self.embeddings_model)

                # InMemoryStore with semantic search
                # For production, replace with:
                # from langgraph.store.postgres.aio import AsyncPostgresStore
                # self._store = AsyncPostgresStore.from_conn_string(self.database_url)
                # await self._store.setup()

                self._store = InMemoryStore(
                    index={
                        "embed": embeddings,
                        "dims": 768,  # Google text-embedding-004 dimension
                        "fields": ["$"]  # Index all fields
                    }
                )
            else:
                self._store = InMemoryStore()

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
            "timeline_events"
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
            "timeline_events"
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

        if self._store:
            # Store cleanup if needed
            pass
