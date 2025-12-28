"""Agent service for API integration."""
import logging
from typing import Dict, Any, Optional, AsyncGenerator
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from langchain_openai import AzureChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.supervisor import supervisor
from app.models.child import Child
from app.models.conversation import Conversation
from app.models.message import Message
from app.config import settings

logger = logging.getLogger(__name__)


class AgentService:
    """
    Service layer for agent interactions.

    Handles:
    - Message processing through supervisor
    - Database updates (conversations, messages)
    - Child profile lookups
    - Error handling and validation
    - Auto-generating conversation titles
    """

    def __init__(self):
        """Initialize the agent service with LLM for title generation."""
        self._title_llm = None

    @property
    def title_llm(self):
        """Lazy-load LLM for title generation."""
        if self._title_llm is None:
            self._title_llm = AzureChatOpenAI(
                azure_deployment=settings.azure_openai_deployment,
                azure_endpoint=settings.azure_openai_endpoint,
                api_key=settings.azure_openai_api_key,
                api_version=settings.azure_openai_api_version,
                max_tokens=150
            )
        return self._title_llm

    async def generate_conversation_title(
        self,
        user_message: str,
        ai_response: str
    ) -> str:
        """
        Generate a concise conversation title based on the first exchange.

        Args:
            user_message: The user's first message
            ai_response: The AI's response

        Returns:
            A 3-6 word title summarizing the conversation topic
        """
        try:
            messages = [
                SystemMessage(content=(
                    "Generate a very short conversation title (3-6 words max). "
                    "Focus on the main topic or concern. No quotes, no punctuation at the end. "
                    "Examples: 'Bedtime Tantrums Help', 'Sibling Rivalry Advice', 'School Anxiety Support'"
                )),
                HumanMessage(content=f"User asked: {user_message[:200]}\n\nAssistant replied about: {ai_response[:200]}")
            ]

            response = await self.title_llm.ainvoke(messages)
            title = response.content.strip().strip('"\'')

            # Ensure reasonable length
            if len(title) > 50:
                title = title[:47] + "..."

            return title if title else "New Conversation"

        except Exception as e:
            logger.warning(f"Failed to generate title: {e}")
            # Fallback: use first few words of user message
            words = user_message.split()[:5]
            return " ".join(words) + ("..." if len(words) == 5 else "")

    async def send_message(
        self,
        db: AsyncSession,
        conversation_id: int,
        user_id: int,
        content: str
    ) -> Dict[str, Any]:
        """
        Send a message and get AI response.

        Args:
            db: Database session
            conversation_id: Conversation ID
            user_id: Parent user ID
            content: Message content

        Returns:
            Dictionary with response and metadata
        """
        # Get conversation with child info
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        # Verify ownership
        result = await db.execute(
            select(Child).where(Child.id == conversation.child_id)
        )
        child = result.scalar_one_or_none()

        if not child or child.parent_id != user_id:
            raise PermissionError("Not authorized to access this conversation")

        # Save user message to database
        user_message = Message(
            conversation_id=conversation_id,
            role="user",
            content=content
        )
        db.add(user_message)
        # Commit user message before workflow to avoid deadlock with AsyncPostgresStore setup
        # (CREATE INDEX CONCURRENTLY waits for all open transactions)
        await db.commit()

        try:
            logger.info(f"Processing message for child {child.id}, age {child.age_years}")
            
            # Process through supervisor agent
            result = await supervisor.process_message(
                child_id=child.id,
                child_age=child.age_years,
                parent_id=user_id,
                conversation_id=conversation_id,
                thread_id=conversation.thread_id,
                user_message=content
            )

            logger.info(f"Supervisor returned response successfully")

            # Save AI response to database
            ai_message = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=result["response"],
                extra_data=str(result.get("metadata", {}))  # Store as JSON string
            )
            db.add(ai_message)

            # Update conversation timestamp
            conversation.updated_at = datetime.now()

            # Auto-generate title on first message exchange
            new_title = None
            if conversation.title == "New Conversation" or conversation.title.startswith("Chat about"):
                # Count messages to confirm this is the first exchange
                msg_count_result = await db.execute(
                    select(func.count(Message.id)).where(Message.conversation_id == conversation_id)
                )
                msg_count = msg_count_result.scalar()

                # If this is the first exchange (user message + AI response = 2 messages including the one we just added)
                if msg_count <= 2:
                    logger.info(f"Generating auto-title for conversation {conversation_id}")
                    new_title = await self.generate_conversation_title(
                        user_message=content,
                        ai_response=result["response"]
                    )
                    conversation.title = new_title
                    logger.info(f"Auto-generated title: {new_title}")

            await db.commit()

            response_data = {
                "message_id": ai_message.id,
                "content": result["response"],
                "requires_human_review": result.get("requires_human_review", False),
                "safety_flags": result.get("safety_flags", []),
                "metadata": result.get("metadata", {})
            }

            # Include new title if generated
            if new_title:
                response_data["new_title"] = new_title

            return response_data

        except Exception as e:
            logger.error(f"Error in supervisor.process_message: {type(e).__name__}: {str(e)}", exc_info=True)
            await db.rollback()
            raise e

    async def send_message_stream(
        self,
        db: AsyncSession,
        conversation_id: int,
        user_id: int,
        content: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Send a message and stream AI response token by token.

        Args:
            db: Database session
            conversation_id: Conversation ID
            user_id: Parent user ID
            content: Message content

        Yields:
            Dictionary with event type and data:
            - {"type": "token", "data": {"content": "..."}}
            - {"type": "metadata", "data": {...}}
            - {"type": "done", "data": {...}}
        """
        # Get conversation with child info
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        # Verify ownership
        result = await db.execute(
            select(Child).where(Child.id == conversation.child_id)
        )
        child = result.scalar_one_or_none()

        if not child or child.parent_id != user_id:
            raise PermissionError("Not authorized to access this conversation")

        # Save user message to database
        user_message = Message(
            conversation_id=conversation_id,
            role="user",
            content=content
        )
        db.add(user_message)
        await db.commit()

        try:
            logger.info(f"Processing streaming message for child {child.id}, age {child.age_years}")

            # Collect the full response for saving
            full_response = ""
            message_id = None

            # Process through supervisor agent with streaming
            async for event in supervisor.process_message_stream(
                child_id=child.id,
                child_age=child.age_years,
                parent_id=user_id,
                conversation_id=conversation_id,
                thread_id=conversation.thread_id,
                user_message=content
            ):
                event_type = event.get("type")

                if event_type == "token":
                    # Yield token to client
                    token = event.get("content", "")
                    full_response += token
                    yield {"type": "token", "data": {"content": token}}

                elif event_type == "analysis_complete":
                    # Analysis phase complete, synthesis starting
                    yield {"type": "status", "data": {"status": "generating"}}

                elif event_type == "done":
                    # Stream complete, save message
                    metadata = event.get("metadata", {})

                    # Save AI response to database
                    ai_message = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=full_response,
                        extra_data=str(metadata)
                    )
                    db.add(ai_message)

                    # Update conversation timestamp
                    conversation.updated_at = datetime.now()

                    # Auto-generate title on first message exchange
                    new_title = None
                    if conversation.title == "New Conversation" or conversation.title.startswith("Chat about"):
                        msg_count_result = await db.execute(
                            select(func.count(Message.id)).where(Message.conversation_id == conversation_id)
                        )
                        msg_count = msg_count_result.scalar()

                        if msg_count <= 2:
                            logger.info(f"Generating auto-title for conversation {conversation_id}")
                            new_title = await self.generate_conversation_title(
                                user_message=content,
                                ai_response=full_response
                            )
                            conversation.title = new_title
                            logger.info(f"Auto-generated title: {new_title}")

                    await db.commit()
                    message_id = ai_message.id

                    # Yield final metadata
                    yield {
                        "type": "done",
                        "data": {
                            "message_id": message_id,
                            "requires_human_review": metadata.get("requires_human_review", False),
                            "safety_flags": metadata.get("safety_flags", []),
                            "new_title": new_title
                        }
                    }

        except Exception as e:
            logger.error(f"Error in streaming: {type(e).__name__}: {str(e)}", exc_info=True)
            await db.rollback()
            raise e

    async def create_conversation(
        self,
        db: AsyncSession,
        child_id: int,
        user_id: int,
        initial_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new conversation.

        Args:
            db: Database session
            child_id: Child ID
            user_id: Parent user ID
            initial_message: Optional first message

        Returns:
            Created conversation data
        """
        # Verify child belongs to user
        result = await db.execute(
            select(Child).where(Child.id == child_id)
        )
        child = result.scalar_one_or_none()

        if not child or child.parent_id != user_id:
            raise PermissionError("Not authorized to create conversation for this child")

        # Generate thread ID
        import uuid
        thread_id = f"thread_{child_id}_{uuid.uuid4().hex[:8]}"

        # Create conversation
        title = "New Conversation"
        if initial_message:
            # Use first 50 chars as title
            title = initial_message[:50] + ("..." if len(initial_message) > 50 else "")

        conversation = Conversation(
            child_id=child_id,
            thread_id=thread_id,
            title=title,
            user_id=user_id,
            is_active=True
        )
        db.add(conversation)
        await db.flush()

        # If initial message provided, process it
        if initial_message:
            await self.send_message(
                db=db,
                conversation_id=conversation.id,
                user_id=user_id,
                content=initial_message
            )

        await db.commit()

        return {
            "id": conversation.id,
            "thread_id": conversation.thread_id,
            "title": conversation.title,
            "child_id": child_id,
            "created_at": conversation.created_at.isoformat()
        }

    async def get_conversation_history(
        self,
        db: AsyncSession,
        conversation_id: int,
        user_id: int,
        limit: int = 50
    ) -> list[Dict[str, Any]]:
        """
        Get conversation message history.

        Args:
            db: Database session
            conversation_id: Conversation ID
            user_id: Parent user ID
            limit: Maximum messages to return

        Returns:
            List of messages
        """
        # Verify access
        result = await db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conversation = result.scalar_one_or_none()

        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        result = await db.execute(
            select(Child).where(Child.id == conversation.child_id)
        )
        child = result.scalar_one_or_none()

        if not child or child.parent_id != user_id:
            raise PermissionError("Not authorized to access this conversation")

        # Get messages - order by id (more reliable than timestamp)
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.id.asc())
            .limit(limit)
        )
        messages = result.scalars().all()

        return [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]


# Global service instance
agent_service = AgentService()
