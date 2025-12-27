"""Authentication request/response schemas."""
from typing import Optional
from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    """User registration request."""
    email: str
    password: str = Field(min_length=8, max_length=100)
    full_name: str = Field(min_length=1, max_length=255)


class UserLogin(BaseModel):
    """User login request."""
    email: str
    password: str


class Token(BaseModel):
    """Token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    """Token refresh request."""
    refresh_token: str


class FirebaseAuth(BaseModel):
    """Firebase authentication request."""
    id_token: str = Field(description="Firebase ID token from client SDK")


class UserResponse(BaseModel):
    """User response."""
    id: int
    email: str
    full_name: str
    is_active: bool
    is_verified: bool
    firebase_uid: Optional[str] = None

    class Config:
        from_attributes = True
