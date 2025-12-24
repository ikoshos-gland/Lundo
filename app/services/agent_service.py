"""Agent service for API integration."""
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.agents.supervisor import supervisor
from app.models.child import Child
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole


class AgentService:
    """
    Service layer for agent interactions.

    Handles:
    - Message processing through supervisor
    - Database updates (conversations, messages)
    - Child profile lookups
    - Error handling and validation
    """

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
            role=MessageRole.USER,
            content=content
        )
        db.add(user_message)
        await db.flush()

        try:
            # Process through supervisor agent
            result = await supervisor.process_message(
                child_id=child.id,
                child_age=child.age_years,
                parent_id=user_id,
                conversation_id=conversation_id,
                thread_id=conversation.thread_id,
                user_message=content
            )

            # Save AI response to database
            ai_message = Message(
                conversation_id=conversation_id,
                role=MessageRole.ASSISTANT,
                content=result["response"],
                metadata=str(result.get("metadata", {}))  # Store as JSON string
            )
            db.add(ai_message)

            # Update conversation timestamp
            conversation.updated_at = datetime.now()

            await db.commit()

            return {
                "message_id": ai_message.id,
                "content": result["response"],
                "requires_human_review": result.get("requires_human_review", False),
                "safety_flags": result.get("safety_flags", []),
                "metadata": result.get("metadata", {})
            }

        except Exception as e:
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

        # Get messages
        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = result.scalars().all()

        # Reverse to chronological order
        messages = list(reversed(messages))

        return [
            {
                "id": msg.id,
                "role": msg.role.value,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]


# Global service instance
agent_service = AgentService()
