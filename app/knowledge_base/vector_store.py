"""Vector store setup for knowledge base (books, activities, strategies)."""
import os
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

from app.config import settings


class KnowledgeBaseVectorStore:
    """
    Vector store for child behavioral therapy resources.

    Collections:
    - books: Age-appropriate book recommendations
    - activities: Developmental activities and games
    - strategies: Parenting strategies and interventions
    """

    def __init__(self):
        """Initialize vector store with Chroma and Gemini embeddings."""
        # Initialize embeddings
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=settings.google_api_key
        )

        # Initialize Chroma client
        self.client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port
        )

        # Initialize collections
        self.books_store: Optional[Chroma] = None
        self.activities_store: Optional[Chroma] = None
        self.strategies_store: Optional[Chroma] = None

    async def initialize_collections(self):
        """Initialize or load vector store collections."""
        # Books collection
        self.books_store = Chroma(
            client=self.client,
            collection_name="books",
            embedding_function=self.embeddings
        )

        # Activities collection
        self.activities_store = Chroma(
            client=self.client,
            collection_name="activities",
            embedding_function=self.embeddings
        )

        # Strategies collection
        self.strategies_store = Chroma(
            client=self.client,
            collection_name="strategies",
            embedding_function=self.embeddings
        )

    async def add_books(self, books: List[Dict[str, Any]]):
        """
        Add books to the vector store.

        Args:
            books: List of book dictionaries with keys:
                - title: Book title
                - author: Author name
                - age_range: Tuple (min_age, max_age)
                - topics: List of topics covered
                - description: Book description
                - amazon_link: Optional purchase link
        """
        documents = []
        for book in books:
            doc = Document(
                page_content=f"{book['title']} by {book['author']}. {book['description']}",
                metadata={
                    "title": book["title"],
                    "author": book["author"],
                    "min_age": book["age_range"][0],
                    "max_age": book["age_range"][1],
                    "topics": ",".join(book["topics"]),
                    "amazon_link": book.get("amazon_link", ""),
                    "type": "book"
                }
            )
            documents.append(doc)

        if self.books_store and documents:
            await self.books_store.aadd_documents(documents)

    async def add_activities(self, activities: List[Dict[str, Any]]):
        """
        Add activities to the vector store.

        Args:
            activities: List of activity dictionaries
        """
        documents = []
        for activity in activities:
            doc = Document(
                page_content=f"{activity['name']}. {activity['description']}",
                metadata={
                    "name": activity["name"],
                    "min_age": activity["age_range"][0],
                    "max_age": activity["age_range"][1],
                    "duration_minutes": activity.get("duration_minutes", 0),
                    "materials": ",".join(activity.get("materials", [])),
                    "skills_developed": ",".join(activity.get("skills_developed", [])),
                    "type": "activity"
                }
            )
            documents.append(doc)

        if self.activities_store and documents:
            await self.activities_store.aadd_documents(documents)

    async def add_strategies(self, strategies: List[Dict[str, Any]]):
        """
        Add parenting strategies to the vector store.

        Args:
            strategies: List of strategy dictionaries
        """
        documents = []
        for strategy in strategies:
            doc = Document(
                page_content=f"{strategy['title']}. {strategy['description']}",
                metadata={
                    "title": strategy["title"],
                    "category": strategy["category"],
                    "min_age": strategy["age_range"][0],
                    "max_age": strategy["age_range"][1],
                    "difficulty": strategy.get("difficulty", "medium"),
                    "issues_addressed": ",".join(strategy.get("issues_addressed", [])),
                    "type": "strategy"
                }
            )
            documents.append(doc)

        if self.strategies_store and documents:
            await self.strategies_store.aadd_documents(documents)

    async def search_books(
        self,
        query: str,
        child_age: int,
        k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant books.

        Args:
            query: Search query (topic, issue, etc.)
            child_age: Child's age to filter results
            k: Number of results to return

        Returns:
            List of matching books
        """
        if not self.books_store:
            return []

        # Search with similarity
        results = await self.books_store.asimilarity_search_with_relevance_scores(
            query=query,
            k=k * 2,  # Get more to filter by age
        )

        # Filter by age and format
        books = []
        for doc, score in results:
            if doc.metadata["min_age"] <= child_age <= doc.metadata["max_age"]:
                books.append({
                    "title": doc.metadata["title"],
                    "author": doc.metadata["author"],
                    "age_range": (doc.metadata["min_age"], doc.metadata["max_age"]),
                    "topics": doc.metadata["topics"].split(","),
                    "amazon_link": doc.metadata.get("amazon_link", ""),
                    "relevance_score": score
                })

                if len(books) >= k:
                    break

        return books

    async def search_activities(
        self,
        query: str,
        child_age: int,
        duration_max: Optional[int] = None,
        k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant activities.

        Args:
            query: Search query
            child_age: Child's age
            duration_max: Maximum duration in minutes (optional filter)
            k: Number of results

        Returns:
            List of matching activities
        """
        if not self.activities_store:
            return []

        results = await self.activities_store.asimilarity_search_with_relevance_scores(
            query=query,
            k=k * 2
        )

        activities = []
        for doc, score in results:
            if doc.metadata["min_age"] <= child_age <= doc.metadata["max_age"]:
                if duration_max and doc.metadata.get("duration_minutes", 0) > duration_max:
                    continue

                activities.append({
                    "name": doc.metadata["name"],
                    "description": doc.page_content,
                    "age_range": (doc.metadata["min_age"], doc.metadata["max_age"]),
                    "duration_minutes": doc.metadata.get("duration_minutes", 0),
                    "materials": doc.metadata.get("materials", "").split(","),
                    "skills_developed": doc.metadata.get("skills_developed", "").split(","),
                    "relevance_score": score
                })

                if len(activities) >= k:
                    break

        return activities

    async def search_strategies(
        self,
        query: str,
        child_age: int,
        category: Optional[str] = None,
        k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for parenting strategies.

        Args:
            query: Search query
            child_age: Child's age
            category: Optional category filter
            k: Number of results

        Returns:
            List of matching strategies
        """
        if not self.strategies_store:
            return []

        results = await self.strategies_store.asimilarity_search_with_relevance_scores(
            query=query,
            k=k * 2
        )

        strategies = []
        for doc, score in results:
            if doc.metadata["min_age"] <= child_age <= doc.metadata["max_age"]:
                if category and doc.metadata.get("category") != category:
                    continue

                strategies.append({
                    "title": doc.metadata["title"],
                    "description": doc.page_content,
                    "category": doc.metadata["category"],
                    "age_range": (doc.metadata["min_age"], doc.metadata["max_age"]),
                    "difficulty": doc.metadata.get("difficulty", "medium"),
                    "issues_addressed": doc.metadata.get("issues_addressed", "").split(","),
                    "relevance_score": score
                })

                if len(strategies) >= k:
                    break

        return strategies


# Global instance
knowledge_base = KnowledgeBaseVectorStore()
