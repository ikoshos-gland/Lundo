"""Conversation database model."""
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Integer, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.child import Child
    from app.models.message import Message
    from app.models.exploration_qa import ExplorationQA


class Conversation(Base):
    """
    Conversation model representing a therapy session thread.

    Attributes:
        child_id: Foreign key to Child
        thread_id: LangGraph thread ID for conversation state
        title: Conversation title (auto-generated from first message)
        summary: Brief summary of conversation topic
        is_active: Whether conversation is active or archived
        child: Relationship to Child
        messages: Relationship to Messages
    """

    __tablename__ = "conversations"

    child_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("children.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    thread_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Exploration phase tracking
    exploration_phase: Mapped[str] = mapped_column(
        String(50),
        default="not_started",
        nullable=False
    )  # not_started, exploration_questions, deep_questions, completed
    current_exploration_topic_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )  # UUID for current exploration topic

    # Relationships
    child: Mapped["Child"] = relationship("Child", back_populates="conversations")
    messages: Mapped[List["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at"
    )
    exploration_qa: Mapped[List["ExplorationQA"]] = relationship(
        "ExplorationQA",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ExplorationQA.question_number"
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"<Conversation(id={self.id}, thread_id={self.thread_id}, title={self.title[:50]})>"
