"""Human-in-the-loop interrupt handling API endpoints."""
from typing import Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from langgraph.types import Command

from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


class InterruptDecision(BaseModel):
    """Human decision for interrupted workflow."""
    type: Literal["approve", "edit", "reject"] = Field(
        ...,
        description="Decision type: approve, edit, or reject"
    )
    edited_content: Optional[str] = Field(
        None,
        description="Edited content (required if type is 'edit')"
    )
    reason: Optional[str] = Field(
        None,
        description="Reason for rejection (optional for 'reject')"
    )


class InterruptInfo(BaseModel):
    """Information about a pending interrupt."""
    conversation_id: int
    thread_id: str
    interrupt_payload: dict
    created_at: str


@router.post("/{conversation_id}/approve")
async def approve_interrupt(
    conversation_id: int,
    decision: InterruptDecision,
    current_user: User = Depends(get_current_user)
):
    """
    Approve, edit, or reject a human-in-the-loop interrupt.

    This endpoint resumes a paused conversation with human decision.

    Args:
        conversation_id: Conversation ID
        decision: Human decision (approve/edit/reject)
        current_user: Current authenticated user

    Returns:
        Resume status

    Usage:
        1. GET pending interrupts to see what needs review
        2. POST decision to resume the workflow

    Example decision payloads:
        Approve: {"type": "approve"}
        Edit: {"type": "edit", "edited_content": "Modified response..."}
        Reject: {"type": "reject", "reason": "Too sensitive"}
    """
    # TODO: Verify conversation ownership

    # Validate edited_content if type is 'edit'
    if decision.type == "edit" and not decision.edited_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="edited_content is required when type is 'edit'"
        )

    # Prepare resume command
    # The decision dict will be passed to interrupt() return value
    resume_data = decision.model_dump()

    # TODO: Resume the workflow using LangGraph SDK or agent service
    # This requires access to the graph instance and thread_id
    # For now, return structure showing how it would work

    return {
        "status": "resumed",
        "conversation_id": conversation_id,
        "decision": resume_data,
        "message": "Workflow resumed with human decision"
    }


@router.get("/{conversation_id}/pending")
async def get_pending_interrupts(
    conversation_id: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get pending interrupts for a conversation.

    Returns information about any pending human reviews.

    Args:
        conversation_id: Conversation ID
        current_user: Current authenticated user

    Returns:
        List of pending interrupts with their payloads
    """
    # TODO: Query for pending interrupts from conversation state
    # This requires checking if there's an __interrupt__ in the latest state

    # Placeholder response structure
    return {
        "conversation_id": conversation_id,
        "has_pending_interrupt": False,
        "interrupts": [],
        "message": "No pending interrupts"
    }


@router.get("/list")
async def list_all_pending_interrupts(
    current_user: User = Depends(get_current_user)
):
    """
    List all pending interrupts for the current user.

    Returns all conversations that are waiting for human review.

    Args:
        current_user: Current authenticated user

    Returns:
        List of conversations with pending interrupts
    """
    # TODO: Query all conversations for this user with pending interrupts

    return {
        "pending_reviews": [],
        "total_count": 0
    }
