"""Pydantic schemas for exploration phase API."""
from datetime import datetime
from typing import List, Optional
from enum import Enum

from pydantic import BaseModel, Field


class ExplorationPhase(str, Enum):
    """Exploration workflow phases."""
    NOT_STARTED = "not_started"
    EXPLORATION_QUESTIONS = "exploration_questions"
    DEEP_QUESTIONS = "deep_questions"
    COMPLETED = "completed"


class QuestionAnswer(BaseModel):
    """Single Q&A pair."""
    question: str
    answer: Optional[str] = None
    question_type: str  # "exploration" or "deep"
    question_number: int  # 1-10
    asked_at: datetime
    answered_at: Optional[datetime] = None


class ExplorationStatus(BaseModel):
    """Current exploration phase status."""
    phase: ExplorationPhase
    current_question_number: int = Field(
        ge=0, le=10,
        description="Current question number (1-10), 0 if not started"
    )
    total_questions: int = 10
    current_question: Optional[str] = None
    exploration_qa: List[QuestionAnswer] = []
    deep_qa: List[QuestionAnswer] = []
    initial_concern: Optional[str] = None
    topic_id: Optional[str] = None


class QuestionResponse(BaseModel):
    """Response containing the next question."""
    question: str
    question_number: int = Field(ge=1, le=10)
    question_type: str  # "exploration" or "deep"
    phase: ExplorationPhase
    is_last_question: bool = False
    topic_id: str


class AnswerSubmit(BaseModel):
    """Submit answer to current question."""
    answer: str = Field(min_length=1, description="The user's answer to the current question")


class ExplorationCompleteResponse(BaseModel):
    """Response when exploration phase is complete."""
    exploration_qa: List[QuestionAnswer]
    deep_qa: List[QuestionAnswer]
    initial_concern: str
    topic_id: str


class StartExplorationRequest(BaseModel):
    """Request to start exploration phase."""
    initial_concern: str = Field(min_length=1, description="The parent's initial concern")
