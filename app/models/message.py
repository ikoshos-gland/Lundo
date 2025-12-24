"""Message database model."""
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Integer, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.conversation import Conversation


class MessageRole(str, enum.Enum):
    """Message role enumeration."""
    USER = "user"  # Parent's message
    ASSISTANT = "assistant"  # System response
    SYSTEM = "system"  # System messages


class Message(Base):
    """
    Message model representing a single message in a conversation.

    Attributes:
        conversation_id: Foreign key to Conversation
        role: Message role (user/assistant/system)
        content: Message content
        metadata: JSON metadata (agent traces, tool calls, etc.)
        conversation: Relationship to Conversation
    """

    __tablename__ = "messages"

    conversation_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role: Mapped[MessageRole] = mapped_column(
        SQLEnum(MessageRole, name="message_role"),
        nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string

    # Relationships
    conversation: Mapped["Conversation"] = relationship(
        "Conversation",
        back_populates="messages"
    )

    def __repr__(self) -> str:
        """String representation."""
        content_preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"<Message(id={self.id}, role={self.role}, content='{content_preview}')>"
