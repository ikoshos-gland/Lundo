"""User (Parent) database model."""
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.child import Child


class User(Base):
    """
    User model representing a parent account.

    Attributes:
        email: Unique email address for authentication
        hashed_password: Bcrypt hashed password (nullable for Firebase users)
        full_name: Parent's full name
        is_active: Whether the account is active
        is_verified: Whether email is verified
        firebase_uid: Firebase user UID for Firebase auth users
        children: Relationship to Child profiles
    """

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    firebase_uid: Mapped[Optional[str]] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=True
    )

    # Relationships
    children: Mapped[List["Child"]] = relationship(
        "Child",
        back_populates="parent",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        """String representation."""
        return f"<User(id={self.id}, email={self.email})>"
