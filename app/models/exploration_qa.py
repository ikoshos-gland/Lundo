"""ExplorationQA database model for storing exploration phase questions and answers."""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.conversation import Conversation


class ExplorationQA(Base):
    """
    Model for storing exploration phase Q&A pairs.

    Each row represents a single question-answer pair during the exploration phase.
    A conversation topic can have up to 10 Q&A pairs (5 exploration + 5 deep).

    Attributes:
        conversation_id: Foreign key to Conversation
        topic_id: UUID linking Q&A to a specific exploration topic
        question_type: Type of question ("exploration" or "deep")
        question_number: Question number (1-10)
        question: The question text
        answer: The user's answer (null until answered)
        asked_at: When the question was asked
        answered_at: When the question was answered
    """

    __tablename__ = "exploration_qa"

    conversation_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    topic_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True
    )
    question_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )  # "exploration" or "deep"
    question_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )  # 1-10
    question: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    answer: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    asked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    answered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    conversation: Mapped["Conversation"] = relationship(
        "Conversation",
        back_populates="exploration_qa"
    )

    def __repr__(self) -> str:
        """String representation."""
        return (
            f"<ExplorationQA(id={self.id}, "
            f"conversation_id={self.conversation_id}, "
            f"question_number={self.question_number}, "
            f"type={self.question_type})>"
        )
