"""Pydantic schemas for API request/response validation."""
from app.schemas.auth import (
    Token,
    TokenRefresh,
    UserRegister,
    UserLogin,
    UserResponse,
    FirebaseAuth
)
from app.schemas.child import (
    ChildCreate,
    ChildUpdate,
    ChildResponse
)
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationWithMessages,
    MessageCreate,
    MessageResponse,
    MessageSendResponse
)
from app.schemas.exploration import (
    ExplorationPhase,
    QuestionAnswer,
    ExplorationStatus,
    QuestionResponse,
    AnswerSubmit,
    ExplorationCompleteResponse,
    StartExplorationRequest
)

__all__ = [
    # Auth
    "Token",
    "TokenRefresh",
    "UserRegister",
    "UserLogin",
    "UserResponse",
    "FirebaseAuth",
    # Child
    "ChildCreate",
    "ChildUpdate",
    "ChildResponse",
    # Conversation
    "ConversationCreate",
    "ConversationResponse",
    "ConversationWithMessages",
    "MessageCreate",
    "MessageResponse",
    "MessageSendResponse",
    # Exploration
    "ExplorationPhase",
    "QuestionAnswer",
    "ExplorationStatus",
    "QuestionResponse",
    "AnswerSubmit",
    "ExplorationCompleteResponse",
    "StartExplorationRequest",
]
