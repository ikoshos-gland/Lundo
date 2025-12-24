"""Child profile database model."""
from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Date, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.conversation import Conversation


class Child(Base):
    """
    Child model representing a child's profile.

    Attributes:
        parent_id: Foreign key to parent User
        name: Child's name
        date_of_birth: Child's date of birth
        gender: Child's gender (optional)
        notes: Additional notes about the child
        parent: Relationship to parent User
        conversations: Relationship to Conversations
    """

    __tablename__ = "children"

    parent_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    gender: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    parent: Mapped["User"] = relationship("User", back_populates="children")
    conversations: Mapped[List["Conversation"]] = relationship(
        "Conversation",
        back_populates="child",
        cascade="all, delete-orphan"
    )

    @property
    def age_years(self) -> int:
        """Calculate child's current age in years."""
        from datetime import datetime
        today = datetime.now().date()
        age = today.year - self.date_of_birth.year
        if today.month < self.date_of_birth.month or \
           (today.month == self.date_of_birth.month and today.day < self.date_of_birth.day):
            age -= 1
        return age

    def __repr__(self) -> str:
        """String representation."""
        return f"<Child(id={self.id}, name={self.name}, age={self.age_years})>"
