"""Conversation API endpoints."""
import json
import logging
from typing import List, Optional, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database.session import get_db
from app.models.user import User
from app.models.child import Child
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationWithMessages,
    MessageCreate,
    MessageResponse,
    MessageSendResponse
)
from app.dependencies import get_current_user
from app.services.agent_service import AgentService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new conversation thread for a child.

    Args:
        conversation_data: Conversation creation data
        current_user: Current authenticated user
        db: Database session

    Returns:
        Created conversation

    Raises:
        HTTPException: If child not found or not owned by user
    """
    # Verify child belongs to current user
    result = await db.execute(
        select(Child).where(Child.id == conversation_data.child_id)
    )
    child = result.scalar_one_or_none()

    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )

    if child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create conversation for this child"
        )

    # Create conversation using agent service
    agent_service = AgentService()
    conversation = await agent_service.create_conversation(
        db=db,
        child_id=conversation_data.child_id,
        user_id=current_user.id,
        initial_message=conversation_data.initial_message
    )

    return ConversationResponse(
        id=conversation["id"],
        child_id=conversation["child_id"],
        thread_id=conversation["thread_id"],
        title=conversation["title"],
        is_active=True,
        created_at=conversation["created_at"],
        updated_at=conversation["created_at"]
    )


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    child_id: Optional[int] = Query(None, description="Filter by child ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all conversations for the current user.

    Args:
        child_id: Optional child ID filter
        current_user: Current authenticated user
        db: Database session

    Returns:
        List of conversations
    """
    # Build query
    query = select(Conversation).join(Child).where(Child.parent_id == current_user.id)

    if child_id:
        # Verify child belongs to user
        child_result = await db.execute(
            select(Child).where(Child.id == child_id)
        )
        child = child_result.scalar_one_or_none()

        if not child or child.parent_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this child's conversations"
            )

        query = query.where(Conversation.child_id == child_id)

    # Order by most recent
    query = query.order_by(desc(Conversation.updated_at))

    result = await db.execute(query)
    conversations = result.scalars().all()

    return [
        ConversationResponse(
            id=conv.id,
            child_id=conv.child_id,
            thread_id=conv.thread_id,
            title=conv.title,
            is_active=conv.is_active,
            created_at=conv.created_at.isoformat(),
            updated_at=conv.updated_at.isoformat()
        )
        for conv in conversations
    ]


@router.get("/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: int,
    limit: int = Query(50, ge=1, le=200, description="Maximum messages to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a conversation with its message history.

    Args:
        conversation_id: Conversation ID
        limit: Maximum number of messages to return
        current_user: Current authenticated user
        db: Database session

    Returns:
        Conversation with messages

    Raises:
        HTTPException: If conversation not found or not owned by user
    """
    # Get conversation
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Verify ownership through child
    child_result = await db.execute(
        select(Child).where(Child.id == conversation.child_id)
    )
    child = child_result.scalar_one_or_none()

    if not child or child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation"
        )

    # Get messages - order by id (more reliable than timestamp)
    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.id.asc())
        .limit(limit)
    )
    messages = messages_result.scalars().all()

    return ConversationWithMessages(
        id=conversation.id,
        child_id=conversation.child_id,
        thread_id=conversation.thread_id,
        title=conversation.title,
        is_active=conversation.is_active,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
        messages=[
            MessageResponse(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                created_at=msg.created_at.isoformat()
            )
            for msg in messages
        ]
    )


@router.post("/{conversation_id}/messages", response_model=MessageSendResponse)
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message in a conversation (main interaction endpoint).

    This endpoint processes the user's message through the complete
    multi-agent workflow and returns the assistant's response along
    with safety metadata.

    Args:
        conversation_id: Conversation ID
        message_data: Message content
        current_user: Current authenticated user
        db: Database session

    Returns:
        Message response with safety flags and metadata

    Raises:
        HTTPException: If conversation not found or not owned by user
    """
    # Get conversation
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    if not conversation.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation is not active"
        )

    # Verify ownership through child
    child_result = await db.execute(
        select(Child).where(Child.id == conversation.child_id)
    )
    child = child_result.scalar_one_or_none()

    if not child or child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to send messages in this conversation"
        )

    # Process message through agent workflow
    agent_service = AgentService()

    try:
        response = await agent_service.send_message(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id,
            content=message_data.content
        )

        return MessageSendResponse(
            message_id=response["message_id"],
            content=response["content"],
            requires_human_review=response["requires_human_review"],
            safety_flags=response["safety_flags"],
            metadata=response["metadata"]
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


@router.post("/{conversation_id}/messages/stream")
async def send_message_stream(
    conversation_id: int,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a message and stream the AI response using Server-Sent Events (SSE).

    This endpoint processes the user's message through the complete
    multi-agent workflow and streams the assistant's response token by token.

    SSE Event Types:
    - token: A chunk of the response text
    - metadata: Message metadata (message_id, safety_flags, etc.)
    - done: Stream complete
    - error: An error occurred

    Args:
        conversation_id: Conversation ID
        message_data: Message content
        current_user: Current authenticated user
        db: Database session

    Returns:
        StreamingResponse with SSE events
    """
    # Get conversation
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    if not conversation.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation is not active"
        )

    # Verify ownership through child
    child_result = await db.execute(
        select(Child).where(Child.id == conversation.child_id)
    )
    child = child_result.scalar_one_or_none()

    if not child or child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to send messages in this conversation"
        )

    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events for the streaming response."""
        agent_service = AgentService()

        try:
            async for event in agent_service.send_message_stream(
                db=db,
                conversation_id=conversation_id,
                user_id=current_user.id,
                content=message_data.content
            ):
                event_type = event.get("type", "token")
                data = json.dumps(event.get("data", {}))
                yield f"event: {event_type}\ndata: {data}\n\n"

        except Exception as e:
            logger.error(f"Streaming error: {str(e)}", exc_info=True)
            error_data = json.dumps({"error": str(e)})
            yield f"event: error\ndata: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a conversation (GDPR compliance).

    Args:
        conversation_id: Conversation ID
        current_user: Current authenticated user
        db: Database session

    Raises:
        HTTPException: If conversation not found or not owned by user
    """
    # Get conversation
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # Verify ownership through child
    child_result = await db.execute(
        select(Child).where(Child.id == conversation.child_id)
    )
    child = child_result.scalar_one_or_none()

    if not child or child.parent_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this conversation"
        )

    # Delete conversation (cascade will delete messages)
    await db.delete(conversation)
    await db.commit()

    return None
