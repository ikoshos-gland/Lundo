"""Conversation and message request/response schemas."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ConversationCreate(BaseModel):
    """Create conversation request."""
    child_id: int
    initial_message: Optional[str] = None


class MessageCreate(BaseModel):
    """Send message request."""
    content: str = Field(min_length=1)


class MessageResponse(BaseModel):
    """Message response."""
    id: int
    role: str
    content: str
    created_at: str

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """Conversation response."""
    id: int
    child_id: int
    thread_id: str
    title: str
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ConversationWithMessages(ConversationResponse):
    """Conversation with messages."""
    messages: List[MessageResponse] = []


class MessageSendResponse(BaseModel):
    """Response after sending a message."""
    message_id: int
    content: str
    requires_human_review: bool
    safety_flags: List[str]
    metadata: Dict[str, Any]


# === KNOWLEDGE GATHERING SCHEMAS ===


class KnowledgeGatheringQuestion(BaseModel):
    """Question event from knowledge gathering phase."""
    type: str = "knowledge_gathering_question"
    phase: int  # 1 or 2
    question_number: int
    total_questions: int
    question: str


class AnswerCreate(BaseModel):
    """User's answer to a knowledge gathering question."""
    answer: str = Field(min_length=1)


class ResumeResponse(BaseModel):
    """Response after resuming with an answer."""
    status: str  # "next_question", "phase_complete", "gathering_complete"
    next_question: Optional[KnowledgeGatheringQuestion] = None
    message: Optional[str] = None
